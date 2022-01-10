import * as Sentry from "@sentry/react";

const { SENTRY_DSN, SENTRY_PROJECT_NAME, REACT_APP_VERSION, TARGET } =
  process.env;
export const setUpSentry = () => {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      release: `${SENTRY_PROJECT_NAME}@${REACT_APP_VERSION}`,
      environment: TARGET,
    });

    // 设置公共环境参数
    // Sentry.setUser({
    //   id: ''
    // });
  }
};
