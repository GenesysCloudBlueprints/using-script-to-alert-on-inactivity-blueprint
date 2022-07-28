import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import { Channel } from "./notification";
import { ConfigData,  ConversationManager } from "./ConversationManager";

const CLIENT_ID = "81a7fe1e-497b-4b99-aef0-eb67192750e9";
const ENVIRONMENT = "mypurecloud.com"

function getParameterByName(name: string) {
  // eslint-disable-next-line
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\#&]" + name + "=([^&#]*)"),
    results = regex.exec(window.location.hash);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export const App = () => {
  const [interactionID, setInteractionID] = useState<string>("");
  const [userID, setUserID] = useState<string>("");
  const [token, setToken] = useState("");
  let conversationDetails: any;
  let configData = useRef<null | ConfigData>() ; 

  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      var accessToken = getParameterByName("access_token");
      var id = getParameterByName("state")
      setInteractionID(id);
      setToken(accessToken);
      configData.current = ConversationManager.getItem(interactionID) 
    
      if (token) {
        //make call to get userID to use to set up notification service
        var config = {
          headers: {
            Authorization: "bearer " + token,
          },
        };
        axios
          .get(
            `https://api.${ENVIRONMENT}/api/v2/users/me?expand=token`,
            config
          )
          .then((data) => {
            var id = data.data.id;
            setUserID(id);
          })
          .catch((error) => console.log(error, "error hit "))
          .finally(() => {
            window.location.hash = "";
          });
      }
    } else {
      //read customer data variable
      let id =""; 
      if (window.location.hash) {
        id = window.location.hash.substring(1);
      }
      const redirect_uri = "http://localhost:3003/";
      window.location.assign(
        `https://login.${ENVIRONMENT}/oauth/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
          redirect_uri
        )}&state=${encodeURIComponent(id)}`
      );
    }
  }, [token, interactionID]);

  if (userID && interactionID && token) {
    conversationDetails = {
      token: token,
      interactionID: interactionID,
      userID: userID,
      configData: configData.current
    };
  }

  return (
    <div className="App">
      <header className="App-header"> 
        {userID && <p>{`userID: ${userID}`}</p>}
        {interactionID && <p>{`InteractionID: ${interactionID}`}</p>}
        {conversationDetails && <Channel {...conversationDetails} />}
      </header>
    </div>
  );
};
