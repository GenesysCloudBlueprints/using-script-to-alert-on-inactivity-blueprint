import axios from "axios";
import React, { useState, useEffect } from "react";
import { userToken, userId, custName, ENVIRONMENT } from "./grantLogin";

export const Channel = () => {
  const [connectURI, setConnectURI] = useState("");
  const [channelID, setChannelID] = useState("");
  const [isListening, setIsListening] = useState(false); // monitor if channel is listening for conversation notifications
  const [isConnected, setIsConnected] = useState();
  useEffect(() => {
    if (userToken) {
      axios({
        url: `https://api.${ENVIRONMENT}/api/v2/notifications/channels`,
        method: "POST",
        headers: {
          Authorization: "Bearer " + userToken,
        },
      })
        .then((data) => {
          setConnectURI(data.data.connectUri);
          setChannelID(data.data.id);
        })
        .catch((error) => {
          console.log("error hit from channel: ", error);
        });
    }
    //call subscribe
  }, []);

  function subscribe() {
    if (connectURI) {
      const channel = new WebSocket(connectURI);
      channel.onopen = (event) => {
        //subscribe to user conversations topic
        if (!isListening) {
          axios({
            url: `https://api.${ENVIRONMENT}/api/v2/notifications/channels/${channelID}/subscriptions`,
            method: "POST",
            headers: {
              Authorization: "Bearer " + userToken,
            },
            data: [
              {
                id: `v2.users.${userId}.conversations`, //topic
              },
            ],
          })
            .then((data) => {
              console.log("succesful subscription: ", data);
              setIsListening(true);
            })
            .catch((error) => {
              console.log("error hit from subscribing: ", error);
              setIsListening(false);
            });
        }
      };

      channel.onmessage = (event) => {
        let eventData = JSON.parse(event.data);
        if (eventData.topicName.includes(`v2.users.${userId}.conversations`)) {
          console.log("relevant event message: ", eventData);
          processEvent(eventData.eventBody);
        } else {
          console.log("event message sent");
        }
      };
    }
  }

  function processEvent(eventBody) {
    const participants = eventBody.participants;
    if (!participants[0].name.includes(custName)) {
      //conversation not relevant to customer
      return;
    }
    let customerState = participants[0].chats[0].state;
    let userState = participants[2].chats[0].state;
    if (customerState === "connected" && userState === "connected") {
      setIsConnected(true);
      console.log("set connected to true");
    } else {
      setIsConnected(false);

      //To load url in script page use location.assign
      // window.location.assign("https://developer.genesys.cloud/");
      window.open("https://developer.genesys.cloud/", "_blank");
      console.log("set connected to false");
    }
  }

  subscribe(); //TO-DO-4
  return (
    <>
      <p>{connectURI && "ConnectURI: " + connectURI}</p>
      <p>{channelID && "Channelid: " + channelID}</p>
      <p>{"isConnected: " + isConnected}</p>
    </>
  );
};
