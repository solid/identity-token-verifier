import jwtVerify from "jose/jwt/verify";
import { verify } from "../src/lib/DPoP";
import type { DPoPToken } from "../src/type";
import { encodeToken } from "./fixture/EncodeToken";

/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("jose/jwt/verify");

const dpop: DPoPToken = {
  header: {
    typ: "dpop+jwt",
    alg: "ES256",
    jwk: {
      kty: "EC",
      x: "l8tFrhx-34tV3hRICRDY9zCkDlpBhF42UQUfWVAWBFs",
      y: "9VE4jf_Ok_o64zbTTlcuNJajHmt6v9TDVrU0CdvGRDA",
      crv: "P-256",
    },
  },
  payload: {
    jti: "e1j3V_bKic8-LAEB",
    htm: "GET",
    htu: "https://resource.example.org/protectedresource",
    iat: 1562262618,
  },
  signature:
    "lNhmpAX1WwmpBvwhok4E74kWCiGBNdavjLAeevGy32H3dbF0Jbri69Nm2ukkwb-uyUI4AUg1JSskfWIyo4UCbQ",
};

const dpopRSA: DPoPToken = {
  header: {
    typ: "dpop+jwt",
    alg: "RS256",
    jwk: {
      alg: "RS256",
      kty: "RSA",
      e: "AQAB",
      n: "12oBZRhCiZFJLcPg59LkZZ9mdhSMTKAQZYq32k_ti5SBB6jerkh-WzOMAO664r_qyLkqHUSp3u5SbXtseZEpN3XPWGKSxjsy-1JyEFTdLSYe6f9gfrmxkUF_7DTpq0gn6rntP05g2-wFW50YO7mosfdslfrTJYWHFhJALabAeYirYD7-9kqq9ebfFMF4sRRELbv9oi36As6Q9B3Qb5_C1rAzqfao_PCsf9EPsTZsVVVkA5qoIAr47lo1ipfiBPxUCCNSdvkmDTYgvvRm6ZoMjFbvOtgyts55fXKdMWv7I9HMD5HwE9uW839PWA514qhbcIsXEYSFMPMV6fnlsiZvQQ",
    },
  },
  payload: dpop.payload,
  signature: "",
};

const dpopWrongKeyType: DPoPToken = {
  header: {
    typ: "dpop+jwt",
    alg: "RS256",
    jwk: {
      alg: "RS256",
      kty: "UNSUPPORTED_KEY_TYPE",
      e: "AQAB",
      n: "12oBZRhCiZFJLcPg59LkZZ9mdhSMTKAQZYq32k_ti5SBB6jerkh-WzOMAO664r_qyLkqHUSp3u5SbXtseZEpN3XPWGKSxjsy-1JyEFTdLSYe6f9gfrmxkUF_7DTpq0gn6rntP05g2-wFW50YO7mosfdslfrTJYWHFhJALabAeYirYD7-9kqq9ebfFMF4sRRELbv9oi36As6Q9B3Qb5_C1rAzqfao_PCsf9EPsTZsVVVkA5qoIAr47lo1ipfiBPxUCCNSdvkmDTYgvvRm6ZoMjFbvOtgyts55fXKdMWv7I9HMD5HwE9uW839PWA514qhbcIsXEYSFMPMV6fnlsiZvQQ",
    },
  },
  payload: dpop.payload,
  signature: "",
};

describe("DPoP proof", () => {
  it("Checks conforming proof with EC Key", async () => {
    (jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: dpop.payload,
      protectedHeader: dpop.header,
    });

    expect(
      await verify(
        encodeToken(dpop),
        {
          payload: {
            cnf: { jkt: "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" },
          },
        } as any,
        "GET",
        "https://resource.example.org/protectedresource",
        () => false
      )
    ).toStrictEqual(dpop);
  });

  it("Checks conforming proof with RSA Key", async () => {
    (jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: dpopRSA.payload,
      protectedHeader: dpopRSA.header,
    });

    expect(
      await verify(
        encodeToken(dpopRSA),
        {
          payload: {
            cnf: { jkt: "cbaZgHZazjgQq0Q2-Hy_o2-OCDpPu02S30lNhTsNU1Q" },
          },
        } as any,
        "GET",
        "https://resource.example.org/protectedresource",
        () => false
      )
    ).toStrictEqual(dpopRSA);
  });

  it("Fails unsupported Key type", async () => {
    (jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: dpopWrongKeyType.payload,
      protectedHeader: dpopWrongKeyType.header,
    });

    await expect(
      verify(
        encodeToken(dpopRSA),
        {
          payload: {
            cnf: { jkt: "cbaZgHZazjgQq0Q2-Hy_o2-OCDpPu02S30lNhTsNU1Q" },
          },
        } as any,
        "GET",
        "https://resource.example.org/protectedresource",
        () => false
      )
    ).rejects.toThrow("Expected EC or RSA, got:\nUNSUPPORTED_KEY_TYPE");
  });

  it("Throws on wrong method", async () => {
    (jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: dpop.payload,
      protectedHeader: dpop.header,
    });

    await expect(
      verify(
        encodeToken(dpop),
        {
          payload: {
            cnf: { jkt: "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" },
          },
        } as any,
        "POST",
        "https://resource.example.org/protectedresource",
        () => false
      )
    ).rejects.toThrow("Expected POST, got:\nGET");
  });

  it("Throws on wrong url", async () => {
    (jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: dpop.payload,
      protectedHeader: dpop.header,
    });

    await expect(
      verify(
        encodeToken(dpop),
        {
          payload: {
            cnf: { jkt: "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" },
          },
        } as any,
        "GET",
        "https://resource.example.org/otherresource",
        () => false
      )
    ).rejects.toThrow(
      "Expected https://resource.example.org/otherresource, got:\nhttps://resource.example.org/protectedresource"
    );
  });

  it("Throws on duplicate JTI", async () => {
    (jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: dpop.payload,
      protectedHeader: dpop.header,
    });

    await expect(
      verify(
        encodeToken(dpop),
        {
          payload: {
            cnf: { jkt: "0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I" },
          },
        } as any,
        "GET",
        "https://resource.example.org/protectedresource",
        () => true
      )
    ).rejects.toThrow("Expected false, got:\ntrue");
  });

  it("Throws on wrong confirmation claim", async () => {
    (jwtVerify as jest.Mock).mockResolvedValueOnce({
      payload: dpop.payload,
      protectedHeader: dpop.header,
    });

    await expect(
      verify(
        encodeToken(dpop),
        { payload: { cnf: { jkt: "UNCONFIRMED_KEY_THUMBPRINT" } } } as any,
        "GET",
        "https://resource.example.org/protectedresource",
        () => false
      )
    ).rejects.toThrow(
      "Expected UNCONFIRMED_KEY_THUMBPRINT, got:\n0ZcOCORZNYy-DWpqq30jZyJGHTN0d2HglBV3uiguA4I"
    );
  });
});
