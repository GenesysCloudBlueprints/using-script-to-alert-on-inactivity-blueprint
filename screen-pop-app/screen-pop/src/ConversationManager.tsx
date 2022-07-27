
export interface ConfigData {
    lastState: string; 
    expiry: number; 
}

interface Manager {
    [key: string]: ConfigData;
}

export enum Response {
    NO_CONVERSATIONS, //no conversation saved in local storage 
    NO_INTERACTIONID, //interaction not present in local storage 
    DELETED, //interaction has been removed from local storage
}

export class ConversationManager {


static conversationKey = "conversation"

static saveItem(interactionID : string, lastState: string, ttl: number = 7200000 ) : void {
  const now = new Date() 
  const value = {
    lastState: lastState, 
    expiry: now.getTime() + ttl
  }
  var rawValue = localStorage.getItem(this.conversationKey)
  if(!rawValue){ // no data has been saved previously 
    const data: Manager = {interactionID : value}   
    localStorage.setItem(this.conversationKey, JSON.stringify(data))
    return
  }
var dataBank : Manager = JSON.parse(rawValue);
  
  dataBank[interactionID] = value; 
  localStorage.setItem(this.conversationKey, JSON.stringify(dataBank))
}

static getItem(interactionID: string) : Response | ConfigData{
    var rawValue = localStorage.getItem(this.conversationKey)
  if (!rawValue) return Response.NO_CONVERSATIONS

  var dataBank : Manager = JSON.parse(rawValue);
    //check if item is present in local storage 
if(!dataBank.hasOwnProperty(interactionID)) return Response.NO_INTERACTIONID

  const item = dataBank[interactionID]
  const now = new Date() 
  if(item.expiry && now.getTime() > item.expiry){ //remove item from list 
    delete dataBank[interactionID]
    localStorage.setItem(this.conversationKey, JSON.stringify(dataBank))
    return Response.DELETED
  }

  return item
}
}

