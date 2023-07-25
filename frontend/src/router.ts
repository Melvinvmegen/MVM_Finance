import { createWebHistory, createRouter as _createRouter } from "vue-router";
import { useUserStore } from "./stores/userStore";

export function createRouter() {
  const router = _createRouter({
    history: createWebHistory(),
    routes: [
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
            path: "/customers/edit/:id",
            component: () => import("./pages/user/customer.vue"),
          },
          {
            path: "/invoices/new",
            component: () => import("./pages/user/invoice.vue"),
          },
          {
            path: "/invoices/edit/:id",
            component: () => import("./pages/user/invoice.vue"),
          },
          {
            path: "/quotations/new",
            component: () => import("./pages/user/quotation.vue"),
          },
          {
            path: "/quotations/edit/:id",
            component: () => import("./pages/user/quotation.vue"),
          },
          {
            path: "/revenus",
            component: () => import("./pages/user/revenus.vue"),
          },
          {
            path: "/revenus/edit/:id",
            component: () => import("./pages/user/revenu.vue"),
          },
          {
            path: "/cryptos",
            component: () => import("./pages/user/cryptos.vue"),
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
    const userStore = useUserStore();
    await userStore.signIn({ currentPath: to });
    if (userStore.auth) {
      if (to.path === "/login" || to.path === "/") {
        next("/dashboard");
      }
      next();
    } else {
      if (isPublicPath(to)) {
        return next();
      }
      next("/login");
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
