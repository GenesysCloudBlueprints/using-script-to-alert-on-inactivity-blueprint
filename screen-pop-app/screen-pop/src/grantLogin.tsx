import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { Channel } from './notification';
import { ConfigData, ConversationManager } from './ConversationManager';

function getParameterByName(name: string) {
	name = name.replace(/[\\[]]/, '\\[').replace(/[\]]/, '\\]');
	var regex = new RegExp('[\\#&]' + name + '=([^&#]*)'),
		results = regex.exec(window.location.hash);
	return results === null
		? ''
		: decodeURIComponent(results[1].replace(/\+/g, ' '));
}

export const GrantLogin = () => {
	const [interactionID, setInteractionID] = useState<string>('');
	const [userID, setUserID] = useState<string>('');
	const [token, setToken] = useState('');
	let conversationDetails: any;
	let configData = useRef<null | ConfigData>();

	useEffect(() => {
		if (window.location.hash.includes('access_token')) {
			var accessToken = getParameterByName('access_token');
			var id = getParameterByName('state');
			setInteractionID(id);
			setToken(accessToken);
			configData.current = ConversationManager.getItem(interactionID);

			if (token) {
				//make call to get userID
				var config = {
					headers: {
						Authorization: 'bearer ' + token,
					},
				};
				axios
					.get(
						`https://api.${process.env.REACT_APP_ENVIRONMENT}/api/v2/users/me?expand=token`,
						config
					)
					.then((data) => {
						var id = data.data.id;
						setUserID(id);
					})
					.catch((error) => console.log(error, 'error hit '))
					.finally(() => {
						window.location.hash = '';
					});
			}
		} else {
			//read customer data variable
			let id = '';
			if (window.location.hash) {
				id = window.location.hash.substring(1);
			}
			const redirect_uri =
				'https://genesyscloudblueprints.github.io/using-script-to-alert-on-inactivity-blueprint/';
			//redirects to app after oauth
			window.location.assign(
				`https://login.${
					process.env.REACT_APP_ENVIRONMENT
				}/oauth/authorize?client_id=${
					process.env.REACT_APP_CLIENT_ID
				}&response_type=token&redirect_uri=${encodeURIComponent(
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
			configData: configData.current,
		};
	}

	return (
		<div className='App'>
			<header className='App-header'>
				{userID && <p>{`userID: ${userID}`}</p>}
				{interactionID && <p>{`InteractionID: ${interactionID}`}</p>}
				{conversationDetails && <Channel {...conversationDetails} />}
			</header>
		</div>
	);
};
