import { TextEncoder, TextDecoder } from "util";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
import "@testing-library/jest-dom";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
