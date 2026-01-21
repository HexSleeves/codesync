// Client-side startup
import { Meteor } from "meteor/meteor";

// Import collections for client-side use
import "../../api/sessions/sessions";
import "../../api/files/files";
import "../../api/comments/comments";
import "../../api/cursors/cursors";
import "../../api/chat/chat";

Meteor.startup(() => {
	console.log("CodeSync client started");
});
