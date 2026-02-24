import { ZodError } from "zod";

// Zod validation middleware
export const validate = (schema) => (req, res, next) => {
	try {
		const { body = undefined, query = undefined, params = undefined } = schema;
		if (body) req.body = body.parse(req.body);
		if (query) req.query = query.parse(req.query);
		if (params) req.params = params.parse(req.params);
		return next();
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ message: "Validation failed", issues: error.issues });
		}
		return next(error);
	}
};
