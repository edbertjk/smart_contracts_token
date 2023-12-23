import { 
  Canister, 
  query, 
  text, 
  Record, 
  update, 
  nat64, 
  ic,
  StableBTreeMap,
  Result,
  Vec 
} from 'azle';
import { v4 as uuidv4 } from "uuid";

// This is a global variable that is stored on the heap
let message = '';

const user = Record({
  idUser: text,
  nameUser: text,
  pointUser: nat64,
  createdAt: nat64,
  updatedAt: nat64,
});

const token = Record({
  nameToken: text,
  pointToken: nat64,
  uniqueCode: text,
  createdAt: nat64,
  updatedAt: nat64
});

const prize = Record({
  idPrize: text,
  namePrize: text,
  pointPrize: nat64,
  amountPrize: nat64,
  createdAt: nat64,
  updatedAt: nat64
});

type User = typeof user | any;
let userDatabase = StableBTreeMap<text, User>(3);

type Prize = typeof prize | any;
let prizeDatabase = StableBTreeMap<text, Prize>(1);

type Token = typeof token | any;
let tokenDatabase = StableBTreeMap<text, Token>(2);

export default Canister({
  createUser: update([text], Result(user, text), (name) => {
    try {
      const uniqueUserId = uuidv4();
      if (!name) {
        throw new Error("Name must be added");
      }

      const newUser: User = {
        idUser: uniqueUserId,
        nameUser: name,
        pointUser: 0n,
        createdAt: ic.time(),
        updatedAt: 0n,
      };

      userDatabase.insert(uniqueUserId, newUser);
      return Result.Ok(newUser);
    } catch (err) {
      return Result.Err("Error Creating Account [" + err + "]");
    }
  }),

  createToken: update([text, nat64], Result(token, text), (nameInputToken, pointInputToken) => {
    try {
      const uuidCode = uuidv4();
      if (!nameInputToken || !pointInputToken) {
        throw new Error("Name/Point must be added");
      }

      const newToken: Token = {
        nameToken: nameInputToken,
        pointToken: pointInputToken,
        uniqueCode: uuidCode,
        createdAt: ic.time(),
        updatedAt: 0n,
      };

      tokenDatabase.insert(uuidCode, newToken);
      return Result.Ok(newToken);
    } catch (err) {
      return Result.Err("Error Creating Token [" + err + "]");
    }
  }),

  createPrize: update([text, nat64, nat64], Result(prize, text), (name, poin, amount) => {
    try {
      const uniqueIdPrize = uuidv4();
      if (!name || !poin || !amount) {
        throw new Error("All data must be added");
      }

      const newPrize: Prize = {
        idPrize: uniqueIdPrize,
        namePrize: name,
        pointPrize: poin,
        amountPrize: amount,
        createdAt: ic.time(),
        updatedAt: 0n
      };

      prizeDatabase.insert(uniqueIdPrize, newPrize);
      return Result.Ok(newPrize);
    } catch (err) {
      return Result.Err("Error Creating Prize [" + err + "]");
    }
  }),

  getOnceUser: query([text], user, (id) => {
    const userData = userDatabase.get(id);
    if ("None" in userData) {
      return `The user with id=${id} not found`;
    }
    return userData.Some;
  }),

  getAllUser: query([], Vec(user), () => {
    return userDatabase.values();
  }),

  getAllPrize: query([], Vec(prize), () => {
    return prizeDatabase.values();
  }),

  getAllToken: query([], Vec(token), () => {
    return tokenDatabase.values();
  }),

  redeemToken: update([text, text], Result(user, text), (idUser, idToken) => {
    try {
      const dataToken: Token = tokenDatabase.get(idToken).Some;
      const dataUser: User = userDatabase.get(idUser).Some;

      if (!idUser || !idToken) {
        throw new Error("ID User/ID Token must be submitted");
      }

      dataUser.pointUser += dataToken.pointToken;

      userDatabase.insert(idUser, dataUser);
      return Result.Ok(dataUser);
    } catch (err) {
      return Result.Err("Error Redeem [" + err + "]");
    }
  }),

  exchangePrize: update([text, text], Result(prize, text), (idUser, idPrize) => {
    try {
      const dataPrize: Prize = prizeDatabase.get(idPrize).Some;
      const dataUser: User = userDatabase.get(idUser).Some;

      if (dataPrize.pointPrize > dataUser.pointUser || dataPrize.amountPrize === 0n) {
        throw new Error("Error Amount/Point");
      }

      dataUser.pointUser -= dataPrize.pointPrize;
      dataPrize.amountPrize -= 1n;

      userDatabase.insert(idUser, dataUser);
      prizeDatabase.insert(idPrize, dataPrize);
      return Result.Ok(dataPrize);
    } catch (err) {
      return Result.Err("Error Exchange [" + err + "]");
    }
  }),
});
