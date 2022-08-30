export interface ConfigData {
	lastState: string;
	expiry: number;
}

interface Manager {
	[key: string]: ConfigData;
}

export class ConversationManager {
	static conversationKey = 'conversation';

	static saveItem(
		interactionID: string,
		lastState: string,
		ttl: number = 1000 * 60 * 60 * 24
	): void {
		const now = new Date();
		const value = {
			lastState: lastState,
			expiry: now.getTime() + ttl,
		};
		var rawValue = localStorage.getItem(this.conversationKey);
		if (!rawValue) {
			// no data has been saved previously
			const data: Manager = { interactionID: value };
			localStorage.setItem(this.conversationKey, JSON.stringify(data));
			return;
		}
		var dataBank: Manager = JSON.parse(rawValue);

		dataBank[interactionID] = value;
		localStorage.setItem(this.conversationKey, JSON.stringify(dataBank));
	}

	static getItem(interactionID: string): null | ConfigData {
		var rawValue = localStorage.getItem(this.conversationKey);
		if (!rawValue) return null;

		var dataBank: Manager = JSON.parse(rawValue);
		//check if item is present in local storage
		if (!dataBank.hasOwnProperty(interactionID)) return null;

		const item = dataBank[interactionID];
		const now = new Date();
		if (item.expiry && now.getTime() > item.expiry) {
			//remove item from list
			delete dataBank[interactionID];
			localStorage.setItem(this.conversationKey, JSON.stringify(dataBank));
			return null;
		}

		return item;
	}
}
