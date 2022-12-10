// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import axios, { AxiosInstance } from "axios";
import TokenService from "./tokenService";
import { useIndexStore } from "../store/indexStore"
import { useUserStore } from "../store/userStore"

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || "http://146.59.146.130:8080/api",
  headers: {
    "Content-type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = TokenService.getLocalToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("error", error);
    const indexStore = useIndexStore();
    const userStore = useUserStore();
    if (!error.response) {
      indexStore.setError("Le serveur n'est pas accessible. Réessayez dans quelques secondes.")
      return performRetry(error, null);
    }
    const status = error.response.status;
    const errorData = error.response.data.error || error.response.data;
    const originalConfig = error.config;
    switch (status) {
      case 401:
        console.log("401 Unauthorized", errorData);
        indexStore.setError("Il semblerait que vos authorisations ne vous authorise pas à accéder à cette ressource.")
        if (originalConfig.url !== "/users/login" && error.response) {
          if (error.response.status === 401 && !originalConfig._retry) {
            originalConfig._retry = true;
            try {
              userStore.refreshToken()
              return apiClient(originalConfig);
            } catch (error) {
              userStore.logout();
            }
          }
        }
        break;
      case 403:
        console.log("403 Forbidden", errorData);
        indexStore.setError(errorData.message);
        userStore.logout();
        break;
      case 404:
        console.log("404 Not found", errorData);
        indexStore.setError(errorData.message)
        break;
      case 400:
        console.log("400 Bad request", errorData);
        indexStore.setError(errorData.message)
        break;
      default:
        console.log("Unexpected error", status, errorData);
        indexStore.setError("Oups, nous avons rencontré une erreur inattendue")
    }
    return performRetry(error, errorData);
  }
);

function performRetry(err, rejectData) {
  const rejectDataToReturn = rejectData || err;
  const status = err.response?.status;
  const httpStatusesToFailFast = [
    400,
    401,
    404,
    500
  ];

  if (status && httpStatusesToFailFast.some((value) => value === status)) return Promise.reject(rejectDataToReturn);

  const config = err.config || {};
  config.__retryCount = config.__retryCount || 5;
  console.log(config.__retryCount)
  if (config.__retryCount >= config.retry) return Promise.reject(rejectDataToReturn);

  config.__retryCount += 1;

  const backoff = new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, config.retryDelay || 5000);
  });

  return backoff.then(() => {
    return axios(config);
  });
}

export default apiClient;
