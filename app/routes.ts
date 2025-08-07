import { type RouteConfig, route} from "@react-router/dev/routes";
import * as path from "node:path";

export default [
    route('dashboard', 'routes/admin/dashboard.tsx')

] satisfies RouteConfig;
