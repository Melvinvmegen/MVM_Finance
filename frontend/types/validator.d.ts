import { $v } from "../src/plugins/validator";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $v: typeof $v;
  }
}

export {};
