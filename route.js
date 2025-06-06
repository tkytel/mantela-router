'use strict';

let mantelas;

async function
loadMantela(e)
{
	e.preventDefault();

	btnLoad.disabled = true;
	const start = performance.now();
	const results = await fetchMantelas3(urlMantela.value);
	mantelas = results.mantelas;
	const errors = results.errors;
	const end = performance.now();
	outputMantela.textContent = `Fetched ${mantelas.size} Mantelas (${end-start|0} ms)`;
	btnLoad.disabled = false;

	const cloneError = outputError.cloneNode(false);
	outputError.parentNode.replaceChild(cloneError, outputError);
	errors.forEach(e => {
		const dt = document.createElement('dt');
		dt.textContent = e.message;

		const ddNameMesg = document.createElement('dd');
		ddNameMesg.textContent = {
			TypeError: /* may be thrown by fetch() */
				'Mantela.json の取得に失敗した可能性があります'
				+ '（CORS の設定や HTTP ヘッダを確認してみてください）',
			Error: /* may be thrown if status code is not OK */
				'Mantela.json の取得に失敗した可能性があります'
				+ '（正しい URL であるか確認してみてください）',
			SyntaxError: /* may be thrown by res.json() */
				'Mantela.json の解釈に失敗した可能性があります'
				+ '（書式に問題がないか確認してみてください）',
			AbortError: /* may be thrown by AbortController */
				'Mantela.json の取得がタイムアウトしました'
				+ '（ネットワークの状態を確認してみてください）',
		}[e.cause.name] || '不明なエラーです';

		const ddCause = document.createElement('dd');
		ddCause.textContent = String(e.cause);

		cloneError.append(dt, ddNameMesg, ddCause);
	});
	summaryError.textContent = `エラー情報（${errors.length} 件）`;

	mantelas.forEach(v => {
		const e = v.mantela;
		const option = document.createElement('option');
		option.value = e.aboutMe.identifier;
		option.textContent = `${e.aboutMe.name} (${e.aboutMe.identifier})`;
		pbxFrom.append(option);
	});
	mantelas.forEach(v => {
		const e = v.mantela;
		const option = document.createElement('option');
		option.value = e.aboutMe.identifier;
		option.textContent = `${e.aboutMe.name} (${e.aboutMe.identifier})`;
		pbxTo.append(option);
	});
}
formMantela.addEventListener('submit', loadMantela);

async function
updateTerminals(e)
{
	const clone = terminalTo.cloneNode(false);
	terminalTo.parentNode.replaceChild(clone, terminalTo);
	const option = document.createElement('option');
	option.textContent = '---';
	clone.append(option);

	const mantela = mantelas.get(pbxTo.value)?.mantela;
	if (!mantela)
		return;
	mantela.extensions.forEach(e => {
		const option = document.createElement('option');
		option.value = e.extension;
		option.textContent = `${e.name} (${e.extension})`;
		clone.append(option);
	});
}
pbxTo.addEventListener('change', updateTerminals);

const costs = {
	pb: n => 120 * n.length,
	dp10: n => 600 * n.length + [...n].reduce((c, e) => c + 100 * ((+e+9) % 10 + 1), 0),
	dp20: n => 450 * n.length + [...n].reduce((c, e) => c + 50 * ((+e+9) % 10 + 1), 0),
};

async function
searchRoute(mantelas, from, to, cost, init = '', output = undefined)
{
	function
	updateStatus(msg)
	{
		if (output)
			output.textContent = msg;
	}

	const minimal = new Map();
	minimal.set(from, cost(init));

	const queue = new Map();
	queue.set(cost(init), [ { number: init, identifier: from, first: true } ]);

	while (queue.size > 0) {
		const min = [...queue.keys()].sort((a, b) => a - b)[0];
		const current = queue.get(min).shift();
		if (queue.get(min).length === 0)
			queue.delete(min);

		const mantela = mantelas.get(current.identifier)?.mantela;
		if (!mantela || mantela.aboutMe.unavailable)
			continue;

		if (current.identifier === to)
			return current.number;

		updateStatus(current.number);
		await new Promise(r => setTimeout(r));
		const hoppable = mantela.providers.find(e => {
			return e.identifier === current.identifier;
		});
		if (!hoppable && !current.first)
			continue;
		mantela.providers.forEach(e => {
			const hopPrefix = current.first ? '' : hoppable.prefix;
			const elem = {
				number: current.number + hopPrefix + e.prefix,
				identifier: e.identifier,
			};

			const minimalCost = minimal.get(elem.identifier) || Infinity;
			if (cost(elem.number) >= minimalCost || !e.prefix || e.unavailable)
				return;
			minimal.set(elem.identifier, cost(elem.number));

			const array = queue.get(cost(elem.number)) || [];
			array.push(elem);
			queue.set(cost(elem.number), array);
		});
	}

	return null;
}

async function
calculateRoute(e)
{
	e.preventDefault();

	const from = pbxFrom.value;
	const cost = costs[callBy.value];
	const to = pbxTo.value;

	btnSearch.disabled = true;
	const route = await searchRoute(mantelas, from, to, cost, '', outputSearch);
	btnSearch.disabled = false;

	if (route === null)
		outputSearch.textContent = 'No route found.';
	else
		outputSearch.textContent = 'Found: ' + route + terminalTo.value;
}
formRouter.addEventListener('submit', calculateRoute);

const urlSearch = new URLSearchParams(document.location.search);
if (urlSearch.get('first')) {
	urlMantela.value = urlSearch.get('first');
	btnLoad.click();
}
