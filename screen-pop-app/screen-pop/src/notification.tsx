import axios from "axios";
import React, { useState, useEffect } from "react";
import { ENVIRONMENT } from "./grantLogin";

interface ConversationDetails {
  token: string;
  interactionID: string;
  userID: string;
}

interface IProps {
  close?: boolean;
}
export const Channel = ({
  token,
  interactionID,
  userID,
}: ConversationDetails) => {
  const [chatStatus, setChatStatus] = useState<string>("");
  const [closeChat, setCloseChat] = useState(false);
  useEffect(() => {
    let completed = localStorage.getItem(interactionID); //check if script has run already by retrieving saved data using unique interactionID key
    if (completed) {
      setChatStatus(completed);
      setCloseChat(true);
      return;
    }
    if (token) {
      //create channel
      axios({
        url: `https://api.${ENVIRONMENT}/api/v2/notifications/channels`,
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
    console.log("running subscribe");
    console.log("connectURI: ", connectURI);
    if (connectURI) {
      const channel = new WebSocket(connectURI);
      channel.onopen = () => {
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
            console.log("succesful subscription: ", data);
          })
          .catch((error) => {
            console.log("error hit from subscribing: ", error);
          });
      };

      channel.onmessage = (event) => {
        let eventData = JSON.parse(event.data);
        if (eventData.eventBody.id === interactionID) {
          console.log("Critical event message: ", eventData);
          const connectionState = processEvent(eventData.eventBody);
          if (!connectionState) {
            setChatStatus("disconnected");
            localStorage.setItem(interactionID, "disconnected");
            //To load url in iframe use location.assign
            //window.location.assign("https://developer.genesys.cloud/");

            //window.open("https://developer.genesys.cloud/", "_blank"); //screenpop url
            channel.close();
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
    if (customerState === "connected" && userState === "connected") {
      return true;
    } else {
      return false;
    }
  }

  return (
    <>
      <p>{"chat status: " + chatStatus}</p>
      {chatStatus === "disconnected" && <PopupTimer close={closeChat} />}
    </>
  );
};

const PopupTimer = ({ close }: IProps) => {
  const [seconds, setSeconds] = useState(0);
  const [screenPop, setScreenPop] = useState(true);

  useEffect(() => {
    let interval = setInterval(() => {
      setSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => clearInterval(interval);
  });

  if (seconds > 10 || close) {
    if (screenPop) {
      window.open("https://developer.genesys.cloud/", "_blank"); //screenpop url
      setScreenPop(false);
    }
    return <p>END CHAT!</p>;
  }

  return <p>{`Conversation ended (elapsed Time): ${seconds} `}</p>;
};
