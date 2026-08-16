let popup;

async function
RunInputHelper(e)
{
	//console.log('btnInputHelper clicked')
	popup = window.open('./index.html?first=https://unstable.kusaremkn.com/.well-known/mantela.json&popup=true', '_blank', 'popup=true');
	if (popup===null) {
		console.error('window.open() error')
	}
}

btnInputHelper.addEventListener('click', RunInputHelper);

window.addEventListener('message', (message) => {
	if (message.origin !== popup.origin) return;
	phoneNumber.value = message.data.phoneNumber;
}, false);
