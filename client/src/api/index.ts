import { Http } from "./http";
import { Ws } from "./ws";
import { Api } from "./api";

export const api = new Api(new Http(), new Ws());
