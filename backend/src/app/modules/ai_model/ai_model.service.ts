import ApiError from "../../../errors/api_error";
import { ITokenPayload } from "../../../interfaces/token";
import { timeoutLimit } from "../../../utils/timeout_limit";
import { User } from "../user/user.model";
import { IAIModel, IAlternateEndingPayload } from "./ai_model.interface";
import { generateWithGeminiStories, generateAlternateEndingsWithGemini } from "./ai_model.utils";
import httpStatus from "http-status";


const aiModelGenerate = async (payload: IAIModel, token: ITokenPayload) => {
  try {
    const { email } = token;
    const { prompt, wordLength, numStories, language } = payload;
    const result = await Promise.race([
      timeoutLimit(60000),
      generateWithGeminiStories(prompt, wordLength, numStories, language),
    ]);

    if (result) {
      const user = await User.findOne({ email: email });

      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
      }

      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      if (user.lastRequestDate && user.lastRequestDate < firstDayOfMonth) {
        user.requestsThisMonth = 0;
        user.lastRequestDate = currentDate;
      }

      user.requestsThisMonth += 1;
      user.lastRequestDate = currentDate;
      await user.save();
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.GATEWAY_TIMEOUT, "Request timed out!");
  }
};

const aiFreeModelGenerate = async (payload: IAIModel) => {
  try {
    const { prompt, language } = payload;
    const result = await Promise.race([
      timeoutLimit(10000),
      generateWithGeminiStories(prompt, 150, 2, language),
    ]);
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.GATEWAY_TIMEOUT, "Request timed out!");
  }
};

const aiModelAlternateEndings = async (
  payload: IAlternateEndingPayload,
  token: ITokenPayload
) => {
  try {
    const { email } = token;
    const { title, content, tag, language } = payload;
    const result = await Promise.race([
      timeoutLimit(60000),
      generateAlternateEndingsWithGemini(title, content, tag, language),
    ]);

    if (result) {
      const user = await User.findOne({ email: email });

      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User not found!");
      }

      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      if (user.lastRequestDate && user.lastRequestDate < firstDayOfMonth) {
        user.requestsThisMonth = 0;
        user.lastRequestDate = currentDate;
      }

      user.requestsThisMonth += 1;
      user.lastRequestDate = currentDate;
      await user.save();
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.GATEWAY_TIMEOUT, "Request timed out!");
  }
};

const aiFreeModelAlternateEndings = async (payload: IAlternateEndingPayload) => {
  try {
    const { title, content, tag, language } = payload;
    const result = await Promise.race([
      timeoutLimit(60000),
      generateAlternateEndingsWithGemini(title, content, tag, language),
    ]);
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.GATEWAY_TIMEOUT, "Request timed out!");
  }
};

export const AiModelService = {
  aiModelGenerate,
  aiFreeModelGenerate,
  aiModelAlternateEndings,
  aiFreeModelAlternateEndings,
};

