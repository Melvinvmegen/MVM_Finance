import { auth } from "@/store/auth.ts";
import axiosMock from "../mocks/axios";

axiosMock();

let url = "";
let body = {};
let mockError = false;

jest.mock("@/services/api.ts", () => ({
  get: (_url, _body) => {
    return new Promise((resolve) => {
      if (mockError) throw Error("API Error occurred.");
      url = _url;
      body = _body;

      resolve({ data: _body.params });
    });
  },
  post: (_url, _body) => {
    return new Promise((resolve) => {
      if (mockError) throw Error("API Error occurred.");
      url = _url;
      body = _body;

      resolve({ data: _body });
    });
  },
  put: (_url, _body) => {
    return new Promise((resolve) => {
      if (mockError) throw Error("API Error occurred.");
      url = _url;
      body = _body;

      resolve({ data: _body });
    });
  },
  delete: (_url, _body) => {
    return new Promise((resolve) => {
      if (mockError) throw Error("API Error occurred.");
      url = _url;
      body = _body;

      resolve({ data: _body });
    });
  },
}));

describe("Auth SignIn", () => {
  it("If user signIn triggers service and mutations", async () => {
    const commit = jest.fn();
    const user = {
      email: "user@example.com",
      password: "password",
    };

    await auth.actions.signIn({ commit }, user);
    expect(url).toBe("/users/login");
    expect(commit).toHaveBeenCalledWith("signInSuccess", user);
  });
});

describe("Auth signUp", () => {
  it("If user signUp triggers service and mutations", async () => {
    mockError = false;
    const commit = jest.fn();
    const user = {
      email: "user@example.com",
      password: "password",
    };

    await auth.actions.signUp({ commit }, user);
    expect(url).toBe("/users/signup");
    expect(commit).toHaveBeenCalledWith("signUpSuccess");
  });

  it("If !user signUp triggers mutation and error", async () => {
    const commit = jest.fn();
    mockError = true;

    await expect(auth.actions.signUp({ commit }, undefined)).rejects.toThrow(
      "API Error occurred."
    );
    expect(commit).toHaveBeenCalledWith("signUpFailure");
  });
});

describe("Auth logOut", () => {
  it("If user signUp triggers service and mutations", async () => {
    mockError = false;
    const commit = jest.fn();
    const user = {
      email: "user@example.com",
      password: "password",
    };

    await auth.actions.signUp({ commit }, user);
    expect(url).toBe("/users/signup");
    expect(commit).toHaveBeenCalledWith("signUpSuccess");
  });

  it("If !user signUp triggers mutation and error", async () => {
    const commit = jest.fn();
    mockError = true;

    await expect(auth.actions.signUp({ commit }, undefined)).rejects.toThrow(
      "API Error occurred."
    );
    expect(commit).toHaveBeenCalledWith("signUpFailure");
  });
});
