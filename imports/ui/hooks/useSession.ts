import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { Session, Sessions } from "../../api/sessions/sessions";

export function useSession(sessionId: string | undefined) {
	return useTracker(() => {
		if (!sessionId) {
			return { session: null, isLoading: false };
		}

		const handle = Meteor.subscribe("session", sessionId);

		return {
			session: Sessions.findOne(sessionId) || null,
			isLoading: !handle.ready(),
		};
	}, [sessionId]);
}

export function useMySessions() {
	return useTracker(() => {
		const handle = Meteor.subscribe("sessions.mine");

		return {
			sessions: Sessions.find({}, { sort: { updatedAt: -1 } }).fetch(),
			isLoading: !handle.ready(),
		};
	}, []);
}
