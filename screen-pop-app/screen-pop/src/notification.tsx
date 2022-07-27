import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { ConfigData, ConversationManager } from "./ConversationManager";

// const SCREENPOP_URL = "https://developer.genesys.cloud/";
interface ConversationDetails {
  token: string;
  interactionID: string;
  userID: string;
  configData?: ConfigData; 
}

export const Channel = ({
  token,
  interactionID,
  userID,
  configData
}: ConversationDetails) => {
  const [chatStatus, setChatStatus] = useState<string>(""); 
  const prevStatus = useRef(configData?.lastState || "");
  const chatState = useRef(configData?.lastState || ""); 
  useEffect(() => {
    if(chatState.current === 'disconnected') return 
    if (token) {
      let channelExists: boolean = false; 
      
      axios({ //get existing channels 
        url: `https://api.mypurecloud.com/api/v2/notifications/channels?includechannels=${token}`,
        method: "GET", 
        headers: {
          Authorization: "Bearer " + token, 
        }
      })
        .then((response) => {
          console.log("check for existing channels: ", response.data.entities[0])
          if (response.data.entities[0]) {// channel already exists 
            channelExists = true; 
            let channelID = response.data.entities[0].id
            let connectUri = response.data.entities[0].connectUri
            axios({
              url: `https://api.mypurecloud.com/api/v2/notifications/channels/${channelID}/subscriptions`, 
              method: "GET", 
              headers: {
                Authorization: "Bearer " + token, 
              }
            })
            .then((response) => {
              console.log("existing subscriptions: ", response.data)
              if (response.data.entities) {
                let subExists = true; 
                listenToNotification(connectUri, channelID, subExists) 
              } 
              else {
                listenToNotification(connectUri, channelID) //subscribe on existing channel 
              } 
              })
            .catch((error)=> console.log("error on get subscriptions: ", error))
          }
        })
        .catch((error) => console.log("error on get channels: ", error))
      
      if (!channelExists) {
       //create channel and subscribe to conversations 
      axios({
        url: `https://api.mypurecloud.com/api/v2/notifications/channels`,
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((data) => {
          listenToNotification(data.data.connectUri, data.data.id);
        })
        .catch((error) => {
          console.log("error hit from channel: ", error);
        });
      }

    }
    // eslint-disable-next-line
  }, [token, interactionID, userID]);

  //listen for notification 
  function listenToNotification(connectURI: string, channelID: string, subscriptionExists?: boolean ) {
      const socket = new WebSocket(connectURI); 
      socket.onopen = () => {
        if (!subscriptionExists) {

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
            prevStatus.current = chatState.current
            chatState.current = "connected";
            ConversationManager.saveItem(interactionID, chatState.current)
            setChatStatus(chatState.current)
            
          })
          .catch((error) => {
            console.log("error hit from subscribing: ", error);
          });
        }
        
      };

      socket.onmessage = (event) => {
        prevStatus.current = chatState.current
        if (chatState.current === "disconnected"){
            return;
        } 

        let eventData = JSON.parse(event.data);

        if (eventData.eventBody.id === interactionID) {
          console.log("Critical event message: ", eventData);
          const connectionState = processEvent(eventData.eventBody);
          if (!connectionState) {
            chatState.current = "disconnected";
            setChatStatus(chatState.current);
            ConversationManager.saveItem(interactionID, chatState.current)
          }
        } else {
          console.log("event message sent: ", eventData);
        }
      };
  }

  function processEvent(eventBody: any) {
    const participants = eventBody.participants;
    let customerState = participants[0].chats[0].state;
    let userState = participants[2].chats[0].state;
    return customerState !== "disconnected" && userState !== "disconnected";
  }

  return (
    <>
      <p> {"chat status: " + chatState.current}</p>
      {chatState.current === 'disconnected' && prevStatus.current === 'connected'  && <PopupTimer />}
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

