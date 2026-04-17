const path = require("path");
const dotenv = require("dotenv");

// Always load backend/.env first so `npm --prefix backend ...` from repo root works.
const backendEnvPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: backendEnvPath });

// Then allow current working directory env to override intentionally.
const cwdEnvPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: cwdEnvPath, override: true });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  awsRegion: requireEnv("AWS_REGION"),
  awsAccessKey: requireEnv("AWS_ACCESS_KEY"),
  awsSecretKey: requireEnv("AWS_SECRET_KEY"),
  awsBucketName: requireEnv("AWS_BUCKET_NAME"),
  awsEndpoint: process.env.AWS_S3_ENDPOINT || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayCurrency: process.env.RAZORPAY_CURRENCY || "INR",
};

module.exports = { env };
