import * as QRCodeLib from 'react-qr-code';
console.log('Type of module:', typeof QRCodeLib);
console.log('Keys:', Object.keys(QRCodeLib));
console.log('Has default export:', 'default' in QRCodeLib);
console.log('Default export value:', QRCodeLib.default);
console.log('Named QRCode export:', QRCodeLib.QRCode);
