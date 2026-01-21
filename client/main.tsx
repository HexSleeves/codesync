import { Meteor } from "meteor/meteor";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "/imports/ui/App";
import "/imports/startup/client";
import "./main.css";

Meteor.startup(() => {
	const container = document.getElementById("react-target");
	if (container) {
		const root = createRoot(container);
		root.render(<App />);
	}
});
