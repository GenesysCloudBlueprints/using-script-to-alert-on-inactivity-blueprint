import axios from "axios";
import React, { useState, useEffect, useRef } from "react";

const SCREENPOP_URL = "https://developer.genesys.cloud/";
interface ConversationDetails {
  token: string;
  interactionID: string;
  userID: string;
}

export const Channel = ({
  token,
  interactionID,
  userID,
}: ConversationDetails) => {
  const [chatStatus, setChatStatus] = useState<string>("");
  const prevStatus = useRef("");
  const chat = useRef("");
  let changedConnectionState: boolean = false;
  let loaded = localStorage.getItem(interactionID)
  useEffect(() => {
    
    if(loaded) return 
    if (token) {
      //create channel
      axios({
        url: `https://api.mypurecloud.com/api/v2/notifications/channels`,
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((data) => {
          subscribe(data.data.connectUri, data.data.id);
        })
        .catch((error) => {
          console.log("error hit from channel: ", error);
        });
    }
    // eslint-disable-next-line
  }, [token, interactionID, userID]);

  function subscribe(connectURI: string, channelID: string) {
    if (connectURI) {
      const channel = new WebSocket(connectURI);
      channel.onopen = () => {
        //subscribe to user conversations topic
        axios({
          url: `https://api.mypurecloud.com/api/v2/notifications/channels/${channelID}/subscriptions`,
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
          data: [
            {
              id: `v2.users.${userID}.conversations`, //topic
            },
          ],
        })
          .then((data) => {
            console.log("succesful subscription: ", data); 
            if (chat.current.length === 0){
              localStorage.setItem(interactionID, 'loaded')
              chat.current = "connected";
              setChatStatus(chat.current)
            } 
          })
          .catch((error) => {
            console.log("error hit from subscribing: ", error);
          });
      };

      channel.onmessage = (event) => {
        console.log('listening now')
        prevStatus.current = chat.current
        if (chat.current === "disconnected"){
            return;
        } 

        let eventData = JSON.parse(event.data);
        console.log(
          "chatStatus: ",
          chat.current,
          "state: ",
          changedConnectionState, 
          'prevStatus: ', prevStatus.current
        );

        if (eventData.eventBody.id === interactionID) {
          console.log("Critical event message: ", eventData);
          const connectionState = processEvent(eventData.eventBody);
          if (!connectionState) {
            chat.current = "disconnected";
            setChatStatus(chat.current);
            changedConnectionState = true;
          }
        } else {
          console.log("event message sent: ", eventData);
        }
      };
    }
  }

  function processEvent(eventBody: any) {
    const participants = eventBody.participants;
    let customerState = participants[0].chats[0].state;
    let userState = participants[2].chats[0].state;
    return customerState !== "disconnected" && userState !== "disconnected";
  }

  return (
    <>
      <p> {chatStatus && "chat status: " + chat.current}</p>
      {chat.current === 'disconnected' && prevStatus.current === 'connected'  && <PopupTimer />}
    </>
  );
};

const PopupTimer = () => {
  const [seconds, setSeconds] = useState(1);
  const TIMEOUT_NUM = 10

  useEffect(() => {
    let timeout: any;
    if (seconds < TIMEOUT_NUM) {
      timeout = setTimeout(() => {
        setSeconds((seconds) => seconds + 1);
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [seconds]);

  if (seconds >= TIMEOUT_NUM) {
    //To load url in iframe use location.assign
    //window.location.assign("https://developer.genesys.cloud/");
    console.log("opening window");
    //window.open(SCREENPOP_URL, "_blank"); //screenpop url
    return <p>END CHAT!</p>;
  }

  return <p>{`Conversation ended (elapsed Time): ${seconds} `}</p>;
};

function saveItem(key : string, value: string, ttl: number = 7200000 ){
  const now = new Date() 
  const item = {
    value: value, 
    expiry: now.getTime() + ttl
  }
  localStorage.setItem(key, JSON.stringify(item))
}

function getItem(key: string){
  const itemStr = localStorage.getItem(key)
  if(!itemStr) return null 
  const item = JSON.parse(itemStr)
  const now = new Date() 
  if(now.getTime() > item.expiry){
    localStorage.removeItem(key)
    return null 
  }
  return item.value
}