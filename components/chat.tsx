import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import socketIOClient from 'socket.io-client';
import userGen from 'username-generator';
import Cookies from 'js-cookie'
import styles from './chat.module.css';
import useStayScrolled from "react-stay-scrolled"; 
import useInterval from "use-interval";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const ENDPOINT = 'https://b00e7e427bae.up.railway.app';
const socket = socketIOClient(ENDPOINT);

const message = { text: "foo" };

const initialMessages = [
  message,
  message,
  message,
  message,
  message,
  message,
  message,
];


function Chat() {
  
  console.log(Cookies.get('name'));

  const [user, setUser] = useState({
    usersList: null
  });
  const [msg, setMsg] = useState('');
  const [recMsg, setRecMsg] = useState({
    listMsg: []
  });
  const [loggedUser, setLoggedUser] = useState();

  useEffect(() => {
    // subscribe a new user
    socket.emit('login', userGen.generateUsername());
    // list of connected users
    socket.on('users', data => {
      setUser({ usersList: JSON.parse(data) });
    });
    // we get the messages
    socket.on('getMsg', data => {
      let listMessages = recMsg.listMsg;
      listMessages.push(JSON.parse(data));
      setRecMsg({ listMsg: listMessages });
    });
  }, []);

  // to send a message
  const sendMessage = () => {
    socket.emit('sendMsg', JSON.stringify({ id: loggedUser.id, msg: msg }));
  };
  // get the logged user
  socket.on('connecteduser', data => {
    setLoggedUser(JSON.parse(data));
  });
  const divRef = useRef(null);
  const { stayScrolled } = useStayScrolled(divRef);
  const [chats, setMessages] = useState(initialMessages);
  useInterval(() => {
    setMessages((prevMessages) => prevMessages.concat([message]));
  }, 500);

  useLayoutEffect(() => {
    stayScrolled();
  }, [chats]);
  
console.log(user.usersList?.length);
  return (
    
    
      <>
      <div style={{ marginBottom: '20px'}}>
        <h3 className={styles.header}>
          
          {' '}
           {user.usersList?.length < 2 || !user.usersList?.length == null ? user.usersList?.length + ' ' + `user online` : 
           user.usersList?.length + ' ' + `users online`}
           
        </h3>
        {/* <table className="table">
          <thead>
            <tr>
              <th> User name </th>
              <th> Connection Date </th>
            </tr>
          </thead>
          <tbody>
            {user.usersList?.map(user => {
              return (<tr key={user.id}>
                <td> {user.userName} </td>
                <td> {user.connectionTime} </td>
              </tr>)
            })}
          </tbody>
        </table> */}
        {/* <h3 className="d-flex justify-content-center"> User : {loggedUser?.userName} </h3> */}
        <div className={styles.schedule}>
          <div style={{ height: '200px', overflow: 'auto' }} ref={divRef}>
          {recMsg.listMsg?.map((msgInfo, index) => {
            return (
              <div className="d-flex justify-content-center" key={index}>
                {' '}
                {/* <b>{msgInfo.userName} </b> : */} {msgInfo.msg}{' '}
                <small style={{ marginLeft: '18px', color: 'blue', marginTop: '5px' }}>
                  {' '}
                  {msgInfo.time}{' '}
                </small>{' '}
  
              </div>
            );
          })}
          </div>
        </div>
        <div className="d-flex justify-content-center">
          <div className={styles.inline}>
          <input
            className={styles.input}
            style={{ display: 'inline',}}
            id="inputmsg"
            placeholder="Post your chat here..."
            onChange={event => setMsg(Cookies.get('name') + ': ' + event.target.value)}
          />
          <button
            
            type="submit"
            style={{borderRadius: '5px'}}
            onClick={() => {
              sendMessage();
            }}
          >
          Send
          </button>
          </div>
        </div>
      </div>
      <hr />
      </>
   
  );
}
export default Chat;
