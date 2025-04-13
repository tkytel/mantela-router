'use strict';

let mantelas;

async function
generateMantelas(firstMantela, output = undefined)
{
	function
	updateStatus(msg)
	{
		if (output)
			output.textContent = msg;
	}

	const start = performance.now();

	const mantelas = new Map();

	const queue = [ firstMantela ];
	const visited = new Set();

	while (queue.length > 0) {
		const url = queue.shift();
		if (visited.has(url))
			continue;

		updateStatus(url);
		const mantela = await fetch(url, { mode: 'cors' })
				.then(res => res.json())
				.catch(err => new Error(err));
		if (mantela instanceof Error)
			continue;
		visited.add(url);

		if (!('aboutMe' in mantela))
			continue;
		mantelas.set(mantela.aboutMe.identifier, mantela);

		if (visited.has(mantela.aboutMe.identifier))
			continue;
		visited.add(mantela.aboutMe.identifier);

		mantela.providers.forEach(e => {
			if (e.mantela)
				queue.push(e.mantela);
		});
	}

	const finish = performance.now()

	updateStatus(`Done.  (${finish-start} ms)`);
	return mantelas;
}

async function
loadMantela(e)
{
	e.preventDefault();

	btnLoad.disabled = true;
	mantelas = await generateMantelas(urlMantela.value, outputMantela);
	btnLoad.disabled = false;

	mantelas.forEach(e => {
		const option = document.createElement('option');
		option.value = e.aboutMe.identifier;
		option.textContent = `${e.aboutMe.name} (${e.aboutMe.identifier})`;
		pbxFrom.append(option);
	});
	mantelas.forEach(e => {
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

	const mantela = mantelas.get(pbxTo.value);
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

		if (current.identifier === to)
			return current.number;

		const mantela = mantelas.get(current.identifier);
		if (!mantela)
			continue;

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
			if (cost(elem.number) >= minimalCost || !e.prefix)
				return;

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
