/**
 * Tera5G HTTP CONNECT proxy server
 *
 * Deploy this on a VPS (DigitalOcean, Hetzner, etc.) on port 80.
 * Then update FreeModeManager.MTN_PROXY_HOST in the Android app to point here.
 *
 * How it works:
 *   Android → CONNECT target:port@mtnplay.co.ug → this server strips @mtnplay.co.ug
 *             → connects to real target → bidirectional tunnel → internet
 *
 * MTN Uganda's carrier proxy sees "mtnplay.co.ug" in the CONNECT line and
 * allows the connection as zero-rated traffic.
 *
 * Usage:
 *   node proxy-server.js
 *   PROXY_PORT=80 node proxy-server.js
 */

'use strict';

const net  = require('net');
const PORT = parseInt(process.env.PROXY_PORT || '80', 10);

const server = net.createServer((clientSocket) => {
    clientSocket.setNoDelay(true);

    let headerBuf = Buffer.alloc(0);
    let headerDone = false;

    clientSocket.on('data', (chunk) => {
        if (headerDone) return; // piping handles this

        headerBuf = Buffer.concat([headerBuf, chunk]);

        const headerEnd = headerBuf.indexOf('\r\n\r\n');
        if (headerEnd === -1) {
            if (headerBuf.length > 8192) {
                clientSocket.end('HTTP/1.0 431 Header Too Large\r\n\r\n');
            }
            return;
        }

        headerDone = true;
        const headerStr  = headerBuf.slice(0, headerEnd).toString('ascii');
        const afterHdrs  = headerBuf.slice(headerEnd + 4);  // data after blank line
        const requestLine = headerStr.split('\r\n')[0];

        // ── Parse: CONNECT host:port[@injectSuffix] HTTP/1.x ─────────────
        const m = requestLine.match(/^CONNECT\s+(\S+)\s+HTTP\/\d\.\d$/i);
        if (!m) {
            clientSocket.end('HTTP/1.0 400 Bad Request\r\n\r\n');
            return;
        }

        let target = m[1];

        // Strip injection suffix (@mtnplay.co.ug or similar)
        const at = target.lastIndexOf('@');
        if (at !== -1) target = target.slice(0, at);

        const colon = target.lastIndexOf(':');
        if (colon === -1) { clientSocket.end('HTTP/1.0 400 Bad Request\r\n\r\n'); return; }

        const targetHost = target.slice(0, colon);
        const targetPort = parseInt(target.slice(colon + 1), 10);

        if (!targetHost || !targetPort || targetPort < 1 || targetPort > 65535) {
            clientSocket.end('HTTP/1.0 400 Bad Request\r\n\r\n');
            return;
        }

        console.log(`CONNECT ${targetHost}:${targetPort} from ${clientSocket.remoteAddress}`);

        // ── Connect to the real target ────────────────────────────────────
        const targetSocket = net.createConnection({ host: targetHost, port: targetPort });
        targetSocket.setNoDelay(true);

        targetSocket.once('connect', () => {
            clientSocket.write('HTTP/1.0 200 Connection Established\r\n\r\n');

            // Flush any data that arrived before we set up the pipe
            if (afterHdrs.length > 0) targetSocket.write(afterHdrs);

            clientSocket.removeAllListeners('data');

            targetSocket.pipe(clientSocket);
            clientSocket.pipe(targetSocket);
        });

        targetSocket.on('error', (err) => {
            console.error(`Target ${targetHost}:${targetPort} error: ${err.message}`);
            try { clientSocket.end('HTTP/1.0 502 Bad Gateway\r\n\r\n'); } catch (_) {}
        });

        clientSocket.on('close', () => targetSocket.destroy());
        targetSocket.on('close', () => clientSocket.destroy());
    });

    clientSocket.on('error', (err) => {
        if (err.code !== 'ECONNRESET') {
            console.error('Client error:', err.message);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Tera5G CONNECT proxy listening on port ${PORT}`);
});

server.on('error', (err) => {
    console.error('Server error:', err.message);
    process.exit(1);
});
