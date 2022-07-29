import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { ConfigData, ConversationManager } from "./ConversationManager";

const ENVIRONMENT = "mypurecloud.com"
const SCREENPOP_URL = "https://developer.genesys.cloud/";
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
   // eslint-disable-next-line
  const [chatStatusDisplay, setChatStatusDisplay] = useState<string>(""); //this property is to trigger new display of chatState 
  const prevStatus = useRef(configData?.lastState || "");
  const chatState = useRef(configData?.lastState || ""); 
  useEffect(() => {
    if(chatState.current === 'disconnected') return 
    if (token) {
      let channelExists: boolean = false; 

      axios({ //get existing channels 
        url: `https://api.${ENVIRONMENT}/api/v2/notifications/channels?includechannels=${token}`,
        method: "GET", 
        headers: {
          Authorization: "Bearer " + token, 
        }
      })
        .then((response) => {
          if (response.data.entities[0]) {// channel already exists 
            channelExists = true; 
            let channelID = response.data.entities[0].id
            let connectUri = response.data.entities[0].connectUri
            axios({
              url: `https://api.${ENVIRONMENT}/api/v2/notifications/channels/${channelID}/subscriptions`, 
              method: "GET", 
              headers: {
                Authorization: "Bearer " + token, 
              }
            })
            .then((response) => {
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
        url: `https://api.${ENVIRONMENT}/api/v2/notifications/channels`,
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
        //subscribe to user conversations topic
          axios({
          url: `https://api.${ENVIRONMENT}/api/v2/notifications/channels/${channelID}/subscriptions`,
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
            prevStatus.current = chatState.current
            chatState.current = "connected";
            ConversationManager.saveItem(interactionID, chatState.current)
            setChatStatusDisplay(chatState.current)
            
          })
          .catch((error) => {
            console.log("error hit from subscribing: ", error);
          });
        
      };

      socket.onmessage = (event) => {
        if (chatState.current === "disconnected"){
            return;
        } 

        let eventData = JSON.parse(event.data);

        if (eventData.eventBody.id === interactionID) {
          const connectionState = processEvent(eventData.eventBody);
          if (!connectionState) {
            chatState.current = "disconnected";
            setChatStatusDisplay(chatState.current);
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
  //
  const [seconds, setSeconds] = useState(1);
  const startTime = useRef(new Date().getTime())

  const TIMEOUT_NUM = 10
  // const [difference, setDifference] = useState(0)
  // const startTime = useRef< number >(new Date().getTime())

  useEffect(() => {
    let timeout: any;
    timeout = setInterval(() => {
      let elapsedTime = Math.floor((new Date().getTime() - startTime.current) / 1000)
        if (elapsedTime <= TIMEOUT_NUM) {
          setSeconds(elapsedTime);
        }
        else {
          //To load url in iframe use location.assign
          //window.location.assign(SCREENPOP_URL);
          window.open(SCREENPOP_URL, "_blank"); //screenpop url/
          clearInterval(timeout)
        }
      }, 1000);
    //eslint-disable-next-line
  }, []);

  return <p>{`Conversation ended (elapsed Time): ${seconds} `}</p>;
};

