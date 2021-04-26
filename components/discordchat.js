import React from "react";
import useSWR from "swr";
import axios from "axios";

const fetcher = (url) => axios.get(url).then((res) => res.data);

function Discord(props) {
  const { data, error } = useSWR(
    `/api/discord/${props.stage}`,
    fetcher,
    { refreshInterval: 10 }
  );
  console.log(data);
  if (error) return <></>;
  if (!data) return <div>Loading latest comments...</div>;
  return (
    <>
      <div>{data.username} - {data.content}</div>   
    </>
  );
}

export default Discord;
