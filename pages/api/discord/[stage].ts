import ms from 'ms';
import fetch, { Headers, RequestInit } from 'node-fetch';
import { NextApiRequest, NextApiResponse } from 'next';

interface Reaction {
  emoji: { name: string };
}

interface Message {
  id: string;
  channel_id: string;
  content: string;
  timestamp: string;
  author: {
    username: string;
  };
  reactions?: Reaction[];
}

interface ReactionSelector {
  id: string;
}

// After creating a bot, add the token as an environment var

// Number of seconds to cache the API response for
const EXPIRES_SECONDS = 60;

// Emoji that should be selected by a whitelisted user
// in order for this API to return the message
const EMOJI = '📸';

// Whitelisted user IDs that are allowed to add the emoji to influence this API
const USERS = [
  '753884596776599632' // username
];

// Discord base API URL
const API = 'https://discordapp.com/api/';

// Map of Stage names to Discord channel IDs
const CHANNELS = new Map<string, string>([
  ['a', '794492593349722112'],
  ['c', '794493170699206656'],
  ['m', '794493229265190972'],
  ['e', '794493261192495104']
]);

const api = (url: string, opts: RequestInit = {}) => {
  const headers = new Headers(opts.headers);
  headers.set('Authorization', `Bot ${process.env.NEXT_PUBLIC_DISCORD}`);
  headers.set('User-Agent', 'Discord Bot (https://event-henna.vercel.app/, v0.1)');

  return fetch(`${API}${url}`, {
    ...opts,
    headers
  });
};

async function getReactionSelectors(
  channelId: string,
  messageId: string,
  emoji: string
): Promise<ReactionSelector[]> {
  const res = await api(
    `channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
  );
  if (!res.ok) {
    throw new Error(`Failed to get message reactions: ${await res.text()} (${res.status})`);
  }
  return res.json();
}

async function getLatestMessageWithEmoji(
  messages: Message[],
  emoji: string,
  usersWhitelist: string[]
) {
  for (const message of messages) {
    if (!message.content.trim()) {
      // Empty message, ignore
      // You could also filter messages here
      continue;
    }
    for (const reaction of message.reactions || []) {
      if (reaction.emoji.name === emoji) {
        const selectors = await getReactionSelectors(message.channel_id, message.id, emoji);
        const selector = selectors.find(r => usersWhitelist.includes(r.id));
        if (selector) {
          // The correct emoji was added from a whitelisted user
          return { message, selector };
        }
      }
    }
  }
}

export default async function getDiscordMessage(req: NextApiRequest, res: NextApiResponse) {
  const { stage } = req.query;
  if (typeof stage !== 'string') {
    return res.status(400).json({ error: 'Query parameter "stage" must be a string' });
  }

  const channelId = CHANNELS.get(stage);
  if (!channelId) {
    return res.status(400).json({ error: `Invalid "stage": ${stage}` });
  }

  const apiRes = await api(`channels/${channelId}/messages`);
  let messages: Message[] = [];
  if (apiRes.status !== 429 && apiRes.ok) {
    messages = await apiRes.json();
  }

  if (apiRes.status === 429) {
    const reset = apiRes.headers.get('X-RateLimit-Reset-After') || 5;
    res.setHeader(
      'Cache-Control',
      `s-maxage=${reset}, public, must-revalidate, stale-while-revalidate`
    );
  }

  const messageToShow = await getLatestMessageWithEmoji(messages, EMOJI, USERS);
  if (!messageToShow) {
    return res.status(404).json({ error: 'Could not find message with emoji' });
  }

  const body = {
    username: messageToShow.message.author.username,
    content: messageToShow.message.content,
    timestamp: messageToShow.message.timestamp
  };

  // Set caching headers
  const expires = new Date(Date.now() + ms(`${EXPIRES_SECONDS}s`));
  res.setHeader('Expires', expires.toUTCString());
  res.setHeader(
    'Cache-Control',
    `s-maxage=${EXPIRES_SECONDS}, immutable, must-revalidate, stale-while-revalidate`
  );

  return res.status(200).json(body);
}