import * as Sentry from "@sentry/nextjs";

export const captureContractError = (error, context = {}) => {
  Sentry.captureException(error, {
    extra: {
      type: "smart_contract_error",
      ...context,
    },
  });
};

export const captureContractEvent = (eventName, data) => {
  Sentry.addBreadcrumb({
    category: "smart_contract",
    message: eventName,
    level: "info",
    data,
  });
};

export const captureUserAction = (action, details = {}) => {
  Sentry.addBreadcrumb({
    category: "user_action",
    message: action,
    level: "info",
    data: details,
  });
};

export const setUserContext = (address, userType) => {
  Sentry.setUser({
    id: address,
    ip_address: undefined,
    extras: { userType },
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

export const captureMessage = (message, level = "info") => {
  Sentry.captureMessage(message, level);
};