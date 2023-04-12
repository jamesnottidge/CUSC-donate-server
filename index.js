require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(
	cors({
		origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
	})
);

app.use(express.json());

const apiUrl = "https://api.flutterwave.com/v3/transactions";
const apiKey = process.env.FLUTIL_API_KEY;

app.get("/api/transaction/:id", (req, res) => {
	const id = req.params.id;
	axios
		.get(`${apiUrl}/id`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
		})
		.then((response) => response.data)
		.then((data) => {
			console.log(data);
			res.send(data);
		})
		.catch((error) => {
			console.log(error);
			res.json({ error: "transaction not found" });
		});
});

app.get("/api/transactions/:startDate", async (req, res) => {
	const startDate = req.params.startDate;
	let pageNumber = 1;
	const allTransactions = [];
	while (pageNumber) {
		console.log(pageNumber);
		await axios
			.get(`${apiUrl}?page=${pageNumber.toString()}&from=${startDate}`, {
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			})
			.then((response) => response.data)
			.then((data) => {
				console.log(data.data);
				allTransactions.push(...data.data);
				if (pageNumber < data.meta.page_info.total_pages) {
					pageNumber++;
				} else {
					pageNumber = false;
					console.log(allTransactions[0]);
					res.send(allTransactions);
				}
				// res.send(data);
			})
			.catch((error) => {
				console.log(error);
				res.json({ error: "transaction not found" });
			});
	}
});

app.get("/api/transactions", async (req, res) => {
	let pageNumber = 1;
	let total_pages = 0;
	const allTransactions = [];
	while (pageNumber) {
		// await axios
		//   .get(
		//     `${apiUrl}?from=2023-04-11&status=successful&page=${pageNumber.toString()}`,
		//     {
		//       headers: {
		//         Authorization: `Bearer ${apiKey}`,
		//       },
		//     }
		//   )
		//   .then((response) => response.data)
		//   .then((data) => {

		console.log("starting fetch");

		await fetch(
			`${apiUrl}?from=2023-04-11&status=successful&page=${pageNumber.toString()}`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			}
		)
			.then((response) => response.json())
			.then((data) => {
				total_pages = Math.ceil(data.meta.page_info.total / 100);
				console.log(data.data.length);

				if (data.data.length > 10) {
					allTransactions.push(...data.data);
					if (pageNumber === total_pages) {
						pageNumber = false;
						return res.send(allTransactions);
					}
					pageNumber++;
				} else if (
					allTransactions.length < data.meta.page_info.total &&
					data.meta.page_info.total_pages == total_pages
				) {
					allTransactions.push(...data.data);
					pageNumber = false;
					console.log(allTransactions.length);
					return res.send(allTransactions);
				}
			})
			.catch((error) => {
				console.log(error);
				res.json({ error: "transaction not found" });
			});
	}
});

app.listen(4000, () => {
	console.log("server is running");
});
