export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  sql: {
    connectionString: process.env.SQLSERVER_CONNECTION_STRING,
  },
});
