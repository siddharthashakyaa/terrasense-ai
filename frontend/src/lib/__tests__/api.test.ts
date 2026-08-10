import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError } from "@/lib/api";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

describe("api.predict", () => {
  it("POSTs the soil payload and returns the parsed prediction", async () => {
    const payload = {
      nitrogen: 80, phosphorus: 40, potassium: 60, ph: 6.5, organic_carbon: 1.2,
      moisture: 45, temperature: 26, humidity: 60, rainfall: 800,
    };
    const responseBody = {
      id: "abc123", soil_health_score: 72, soil_quality: "Good", confidence: 0.91,
      model_name: "xgboost", nutrient_status: {}, deficiencies: [],
      crop_recommendations: [], shap_explanation: [], disclaimer: "demo",
      created_at: "2026-01-01T00:00:00Z",
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(responseBody));

    const result = await api.predict(payload);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/predict");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(payload);
    expect(result.soil_quality).toBe("Good");
    expect(result.soil_health_score).toBe(72);
  });

  it("throws an ApiError with the response status on failure", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ detail: "No trained model found." }, false, 503)
    );

    await expect(
      api.predict({
        nitrogen: 1, phosphorus: 1, potassium: 1, ph: 6, organic_carbon: 1,
        moisture: 1, temperature: 1, humidity: 1, rainfall: 1,
      })
    ).rejects.toMatchObject({ status: 503 });
  });
});

describe("api.history", () => {
  it("builds query params only for provided filters", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));
    await api.history({ soil_quality: "Excellent", limit: 50 });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("soil_quality=Excellent");
    expect(url).toContain("limit=50");
    expect(url).not.toContain("field_id=");
  });

  it("requests without query string when no filters given", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse([]));
    await api.history();
    const [url] = mockFetch.mock.calls[0];
    expect(url.endsWith("/history")).toBe(true);
  });
});

describe("api.trainModels", () => {
  it("returns the training summary from the backend", async () => {
    const body = {
      best_model: "random_forest",
      metrics: [{ model_name: "random_forest", accuracy: 0.9, precision: 0.9, recall: 0.9, f1_score: 0.9, is_active: true, trained_at: "2026-01-01T00:00:00Z" }],
      dataset_rows: 6000,
      message: "done",
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(body));
    const result = await api.trainModels();
    expect(result.best_model).toBe("random_forest");
    expect(result.dataset_rows).toBe(6000);
  });
});

describe("ApiError", () => {
  it("carries a status code distinct from a generic Error", () => {
    const err = new ApiError("failed", 404);
    expect(err.status).toBe(404);
    expect(err.message).toBe("failed");
    expect(err).toBeInstanceOf(Error);
  });
});
