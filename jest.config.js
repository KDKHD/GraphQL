module.exports = {
  rootDir: ".",
  roots: ["./"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/build/*."],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleNameMapper: {
    "@models/(.*)": "<rootDir>/models/$1",
    "@modules/(.*)": "<rootDir>/graphQL/modules/$1",
    "@graphQL/(.*)": "<rootDir>/graphQL/$1",
    "@controllers/(.*)": "<rootDir>/controllers/$1",
    "@routes/(.*)": "<rootDir>/routes/$1",
    "@utils/(.*)": "<rootDir>/utils/$1",
    "@validators/(.*)": "<rootDir>/validators/$1",
    "@schemas/(.*)": "<rootDir>/schemas/$1",
    "@services/(.*)": "<rootDir>/controllers/services/$1",
    "@middlewares/(.*)": "<rootDir>/controllers/services/middlewares/$1",
    "@config/(.*)": "<rootDir>/config/$1",
    "@queries/(.*)": "<rootDir>/queries/$1",
    "@customTypes/(.*)": "<rootDir>/types/$1",
    "@root/(.*)": "<rootDir>/$1",
  },
};
