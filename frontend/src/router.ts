import { createWebHistory, createRouter, RouteRecordRaw } from "vue-router";
import { useUserStore } from "./store/userStore";

const routes: Array<RouteRecordRaw> = [
  {
    path: "",
    component: () => import("./pages/user/_layout.user.vue"),
    redirect: "customers",
    children: [
      {
        path: "/login",
        component: () => import("./pages/public/auth.vue"),
        meta: {
          public: true,
        },
      },
      {
        path: "/customers",
        component: () => import("./pages/user/customers.vue"),
      },
      {
        path: "/customers",
        component: () => import("./pages/user/customers.vue"),
      },
      {
        path: "/customers/new",
        component: () => import("./pages/user/customer.vue"),
        props: true,
      },
      {
        path: "/customers/edit/:id",
        component: () => import("./pages/user/customer.vue"),
        props: true,
      },
      {
        path: "/invoices/new",
        component: () => import("./pages/user/invoice.vue"),
        props: true,
      },
      {
        path: "/invoices/edit/:id",
        component: () => import("./pages/user/invoice.vue"),
        props: true,
      },
      {
        path: "/quotations/new",
        component: () => import("./pages/user/quotation.vue"),
        props: true,
      },
      {
        path: "/quotations/edit/:id",
        component: () => import("./pages/user/quotation.vue"),
        props: true,
      },
      {
        path: "/revenus/edit/:id",
        component: () => import("./pages/user/revenu.vue"),
        props: true,
      },
    ],
  },
  {
    path: "/*",
    component: () => import("./pages/public/_notFound.vue"),
    meta: {
      public: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach( async (to, from, next) => {
  const userStore = useUserStore();
  await userStore.signIn({ currentPath: to });
  if (userStore.auth) {
    if (to.path === "/login" || to.path === "/") {
      next("/customers");
    }
    next();
  } else {
    if (isPublicPath(to)) {
      return next();
    }
    next("/login");
  }
});

const isPublicPath = (to) => {
  for (let i = to.matched.length - 1; i >= 0; i--) {
    if (to.matched[i].meta.public !== undefined) {
      return to.matched[i].meta.public;
    }
  }
  return null;
};

export default router;
