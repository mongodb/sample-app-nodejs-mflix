import { Document, ObjectId } from "mongodb";
import { UpdateMovieRequest } from "../types";

const MOVIE_FIELDS = [
  "title",
  "year",
  "plot",
  "fullplot",
  "genres",
  "directors",
  "writers",
  "cast",
  "countries",
  "languages",
  "rated",
  "runtime",
  "poster",
] as const;

const ALLOWED_FILTER_FIELDS = new Set([...MOVIE_FIELDS, "_id"]);

const ALLOWED_OPERATORS = new Set([
  "$in",
  "$nin",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$ne",
  "$exists",
]);

const UPDATE_FIELDS = [...MOVIE_FIELDS] as (keyof UpdateMovieRequest)[];

const UNSUPPORTED_FILTER_MESSAGE =
  "Filter contains an unsupported field or operator";
const UNSUPPORTED_UPDATE_MESSAGE =
  "Update contains an unsupported field or operator";

export function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class InvalidMongoQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMongoQueryError";
  }
}

function sanitizeOperatorValue(value: unknown): unknown {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const operatorMap = value as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [operator, operatorValue] of Object.entries(operatorMap)) {
    if (!operator.startsWith("$") || !ALLOWED_OPERATORS.has(operator)) {
      throw new InvalidMongoQueryError(UNSUPPORTED_FILTER_MESSAGE);
    }
    sanitized[operator] = operatorValue;
  }

  return sanitized;
}

export function sanitizeBatchFilter(filter: Record<string, unknown>): Document {
  if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
    throw new InvalidMongoQueryError("Filter must be a non-array object");
  }

  const sanitized: Document = {};

  for (const [key, value] of Object.entries(filter)) {
    if (key.startsWith("$") || !ALLOWED_FILTER_FIELDS.has(key)) {
      throw new InvalidMongoQueryError(UNSUPPORTED_FILTER_MESSAGE);
    }

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeOperatorValue(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function sanitizeUpdateFields(
  update: Record<string, unknown>
): UpdateMovieRequest {
  if (!update || typeof update !== "object" || Array.isArray(update)) {
    throw new InvalidMongoQueryError("Update must be a non-array object");
  }

  const sanitized: UpdateMovieRequest = {};

  for (const key of Object.keys(update)) {
    if (
      key.startsWith("$") ||
      !UPDATE_FIELDS.includes(key as keyof UpdateMovieRequest)
    ) {
      throw new InvalidMongoQueryError(UNSUPPORTED_UPDATE_MESSAGE);
    }
    (sanitized as Record<string, unknown>)[key] = update[key];
  }

  return sanitized;
}

export function convertFilterObjectIds(filter: Document): Document {
  const processedFilter: Document = { ...filter };

  if (
    processedFilter._id &&
    typeof processedFilter._id === "object" &&
    processedFilter._id !== null &&
    "$in" in processedFilter._id &&
    Array.isArray(processedFilter._id.$in)
  ) {
    processedFilter._id = {
      $in: processedFilter._id.$in.map((id: unknown) => {
        const idStr = String(id);
        if (ObjectId.isValid(idStr)) {
          return new ObjectId(idStr);
        }
        throw new InvalidMongoQueryError(UNSUPPORTED_FILTER_MESSAGE);
      }),
    };
  }

  return processedFilter;
}
