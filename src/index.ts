import {
  $query,
  $update,
  Record,
  nat64,
  match,
  ic,
  StableBTreeMap,
  Result,
  Vec,
  Opt,
} from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define the User record type
type User = Record<{
  id: string;
  username: string;
  password: string;
  points: nat64;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define the Token record type
type Token = Record<{
  name: string;
  point: nat64;
  uniqueCode: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define the Prize record type
type Prize = Record<{
  id: string;
  name: string;
  point: nat64;
  amount: nat64;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define the Payload type for creating a Prize
type PrizePayload = Record<{
  name: string;
  point: nat64;
  amount: nat64;
}>;

// Create StableBTreeMaps to store user, token, and prize data
const userDatabase = new StableBTreeMap<string, User>(0, 44, 1024);
const tokenDatabase = new StableBTreeMap<string, Token>(1, 44, 1024);
const prizeDatabase = new StableBTreeMap<string, Prize>(2, 44, 1024);

$update
export function createUser(name: string, password: string): Result<User, string> {
  // Payload Validation: Ensure that the name and password are present in the payload
  if (!name || !password) {
    return Result.Err<User, string>('Name and password must be added');
  }

  // Create a new user record
  const uniqueUserId = uuidv4();
  const newUser: User = {
    id: uniqueUserId,
    username: name,
    password: password,
    points: 0n,
    createdAt: ic.time(),
    updatedAt: Opt.None,
  };

  try {
    // Insert the new user into the database
    userDatabase.insert(newUser.id, newUser);
    return Result.Ok<User, string>(newUser);
  } catch (error) {
    return Result.Err<User, string>('Failed to create user');
  }
}

$update
export function createToken(nameInputToken: string, pointInputToken: nat64): Result<Token, string> {
  // Payload Validation: Ensure that the name and point are present in the payload
  if (!nameInputToken || !pointInputToken) {
    return Result.Err<Token, string>('Name and point must be added');
  }

  // Create a new token record
  const uuidCode = uuidv4();
  const newToken: Token = {
    name: nameInputToken,
    point: pointInputToken,
    uniqueCode: uuidCode,
    createdAt: ic.time(),
    updatedAt: Opt.None,
  };

 
  try {
    // Insert the new token into the database
    tokenDatabase.insert(uuidCode, newToken);
    return Result.Ok<Token, string>(newToken);
  } catch (error) {
    return Result.Err<Token, string>('Failed to create token');
  }
}

$update
export function createPrize(payload: PrizePayload): Result<Prize, string> {
  // Payload Validation: Ensure that all data is present in the payload
  if (!payload.name || !payload.point || !payload.amount) {
    return Result.Err<Prize, string>('All data must be added');
  }

  // Create a new prize record
  const uniqueIdPrize = uuidv4();
  const newPrize: Prize = {
    id: uniqueIdPrize,
    name: payload.name,
    point: payload.point,
    amount: payload.amount,
    createdAt: ic.time(),
    updatedAt: Opt.None,
  };

  
  try {
    // Insert the new prize into the database
    prizeDatabase.insert(uniqueIdPrize, newPrize);
    return Result.Ok<Prize, string>(newPrize);
  } catch (error) {
    return Result.Err<Prize, string>('Failed to create prize');
  }
}

$query
export function getOnceUser(id: string): Result<User, string> {
  try {
    // Parameter Validation: Validate the id parameter to ensure it's a valid string
    if (typeof id !== 'string') {
      return Result.Err<User, string>('Invalid ID parameter.');
    }
    // Retrieve user data by ID
    const userData = userDatabase.get(id);

    return match(userData, {
      Some: (user) => Result.Ok<User, string>(user),
      None: () => Result.Err<User, string>(`The user with id=${id} not found`),
    });
  } catch (error) {
    return Result.Err<User, string>(`Error retrieving user: ${error}`);
  }
}

$query
export function getAllUser(): Result<Vec<User>, string> {
  try {
    // Retrieve all user data
    return Result.Ok(userDatabase.values());
  } catch (error) {
    return Result.Err<Vec<User>, string>(`Error retrieving all users: ${error}`);
  }
}

$query
export function getAllPrize(): Result<Vec<Prize>, string> {
  try {
    // Retrieve all prize data
    return Result.Ok(prizeDatabase.values());
  } catch (error) {
    return Result.Err<Vec<Prize>, string>(`Error retrieving all prizes: ${error}`);
  }
}

$query
export function getAllToken(): Result<Vec<Token>, string> {
  try {
    // Retrieve all token data
    return Result.Ok(tokenDatabase.values());
  } catch (error) {
    return Result.Err<Vec<Token>, string>(`Error retrieving all tokens: ${error}`);
  }
}

$update
export function redeemToken(idUser: string, idToken: string): Result<User, string> {
  try {
    // Parameter Validation: Validate the id parameter to ensure it's a valid string
    if (typeof idUser !== 'string') {
      return Result.Err<User, string>('Invalid ID parameter.');
    }
    // Parameter Validation: Validate the id parameter to ensure it's a valid string
    if (typeof idToken !== 'string') {
      return Result.Err<User, string>('Invalid ID parameter.');
    }
    // Match user data by ID
    return match(
      userDatabase.get(idUser),
      {
        Some: (dataUser) => match(
          tokenDatabase.get(idToken),
          {
            Some: (dataToken) => {
              // Update user points with token points
              dataUser.points = dataUser.points + dataToken.point;

              // Update user data in the database
              userDatabase.insert(idUser, dataUser);

              return Result.Ok<User, string>(dataUser);
            },
            None: () => Result.Err<User, string>('Token not found'),
          }
        ),
        None: () => Result.Err<User, string>('User not found'),
      }
    );
  } catch (error) {
    return Result.Err<User, string>(`Error redeeming token: ${error}`);
  }
}

$update
export function exchangePrize(idUser: string, idPrize: string): Result<Prize, string> {
  try {
    // Parameter Validation: Validate the id parameter to ensure it's a valid string
    if (typeof idUser !== 'string') {
      return Result.Err<Prize, string>('Invalid ID parameter.');
    }
    // Parameter Validation: Validate the id parameter to ensure it's a valid string
    if (typeof idPrize !== 'string') {
      return Result.Err<Prize, string>('Invalid ID parameter.');
    }
    // Match user data by ID
    return match(
      userDatabase.get(idUser),
      {
        Some: (dataUser) => {
          // Match prize data by ID
          const prizeData = prizeDatabase.get(idPrize);

          return match(
            prizeData,
            {
              Some: (dataPrize) => {
                if (dataPrize.point > dataUser.points || dataPrize.amount === 0n) {
                  return Result.Err<Prize, string>('Error Amount/Point');
                }

                // Update user points and prize amount
                dataUser.points = dataUser.points - dataPrize.point;
                dataPrize.amount = dataPrize.amount - 1n;

                // Update user and prize data in the database
                userDatabase.insert(idUser, dataUser);
                prizeDatabase.insert(idPrize, dataPrize);

                return Result.Ok<Prize, string>(dataPrize);
              },
              None: () => Result.Err<Prize, string>('Prize not found'),
            }
          );
        },
        None: () => Result.Err<Prize, string>('User not found'),
      }
    );
  } catch (error) {
    return Result.Err<Prize, string>(`Error exchanging prize: ${error}`);
  }
}

// Cryptographic utility for generating random values
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};
