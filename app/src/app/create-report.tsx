
import { Redirect } from "expo-router";

import {
    useAuthSession,
} from "@/features/auth/state/auth-session-context";

import CreateReportScreen from
    "@/features/reports/screens/create-report-screen";

export default function CreateReportRoute() {
    const { user } = useAuthSession();

    if (!user) {
        return (
            <Redirect
                href={{
                    pathname: "/login",
                    params: { next: "report" },
                }}
            />
        );
    }

    return <CreateReportScreen />;
}
