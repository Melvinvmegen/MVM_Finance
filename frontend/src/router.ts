import { createWebHistory, createRouter as _createRouter } from "vue-router";
import { useAuthStore } from "./stores/authStore";

export function createRouter() {
  const router = _createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: "",
        component: () => import("./pages/user/_layout.user.vue"),
        redirect: "dashboard",
        children: [
          {
            path: "/login",
            component: () => import("./pages/public/auth.vue"),
            meta: {
              public: true,
            },
          },
          {
            path: "/logout",
            name: "Logout",
            component: () => import("./pages/public/logout.vue"),
            meta: {
              public: true,
            },
          },
          {
            path: "/dashboard",
            component: () => import("./pages/user/dashboard.vue"),
          },
          {
            path: "/customers",
            component: () => import("./pages/user/customers.vue"),
          },
          {
            path: "/customers/new",
            component: () => import("./pages/user/customer.vue"),
          },
          {
            path: "/customers/:customerId",
            component: () => import("./pages/user/customer.vue"),
          },
          {
            path: "/customers/:customerId/invoices/new",
            component: () => import("./pages/user/invoice.vue"),
          },
          {
            path: "/customers/:customerId/invoices/:id",
            component: () => import("./pages/user/invoice.vue"),
          },
          {
            path: "/customers/:customerId/quotations/new",
            component: () => import("./pages/user/quotation.vue"),
          },
          {
            path: "/customers/:customerId/quotations/:id",
            component: () => import("./pages/user/quotation.vue"),
          },
          {
            path: "/revenus",
            component: () => import("./pages/user/revenus.vue"),
          },
          {
            path: "/revenus/:id",
            component: () => import("./pages/user/revenu.vue"),
          },
          {
            path: "/cryptos",
            component: () => import("./pages/user/cryptos.vue"),
          },
          {
            path: "/assets",
            component: () => import("./pages/user/assets.vue"),
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
    ],
  });

  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    if (isPublicPath(to)) {
      return next();
    } else if (authStore.me || (await authStore.authenticate())) {
      return next();
    } else {
      return next({
        path: "/login",
        query: { redirectUrl: window.location.origin + to.fullPath },
      });
    }
  });

  return router;
}

const isPublicPath = (to) => {
  for (let i = to.matched.length - 1; i >= 0; i--) {
    if (to.matched[i].meta.public !== undefined) {
      return to.matched[i].meta.public;
    }
  }
  return null;
};
