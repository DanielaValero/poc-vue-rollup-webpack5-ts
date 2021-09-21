import { RouteRecordRaw, createRouter, createWebHashHistory } from "vue-router";
import Home from "@/views/home";
import About from "@/views/about";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/about",
    name: "About",
    component: About, // () => import(/* webpackChunkName: "about" */ "@/views/about"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
