import { EventEmitter } from 'events';

export class WebhookManager extends EventEmitter {
  constructor() {
    super();
  }
}

export default WebhookManager;
