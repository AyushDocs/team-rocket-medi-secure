import { jest } from '@jest/globals';
import request from 'supertest';

// 1. Define Mock Functions
const mockRecover = jest.fn();
const mockHasAccess = jest.fn();
const mockPinFileToIPFS = jest.fn();
const mockPinList = jest.fn();

// 2. Mock Modules using the defined mock functions
await jest.unstable_mockModule('web3', () => ({
    default: class {
        constructor() {
            this.eth = {
                accounts: {
                    recover: mockRecover
                },
                Contract: jest.fn().mockImplementation(() => ({
                    methods: {
                        hasAccessToDocument: () => ({
                            call: mockHasAccess
                        })
                    }
                }))
            };
        }
    }
}));

await jest.unstable_mockModule('@pinata/sdk', () => ({
    default: class {
        constructor() {
            this.pinFileToIPFS = mockPinFileToIPFS;
            this.pinList = mockPinList;
        }
    }
}));

await jest.unstable_mockModule('fs', () => ({
    default: {
        readFileSync: jest.fn().mockReturnValue(JSON.stringify({
            networks: { "5777": { address: "0x123" } },
            abi: []
        }))
    },
    readFileSync: jest.fn().mockReturnValue(JSON.stringify({
        networks: { "5777": { address: "0x123" } },
        abi: []
    }))
}));

// 3. Dynamic Import App
const { default: app } = await import('../index.js');

describe('Server API Endpoints', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /files', () => {
        it('should require a file attachment', async () => {
            const res = await request(app)
                .post('/files')
                .send({ userAddress: '0x123' });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('No file uploaded');
        });

        it('should require userAddress', async () => {
            const res = await request(app)
                .post('/files')
                .attach('file', Buffer.from('test'), 'test.txt');
            
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('User address is required');
        });

        it('should upload file successfully', async () => {
            mockPinFileToIPFS.mockResolvedValue({ IpfsHash: 'QmTestHash' });

            const res = await request(app)
                .post('/files')
                .attach('file', Buffer.from('file content'), 'test.txt')
                .field('userAddress', '0xUserAddress');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({ ipfsHash: 'QmTestHash' });
            expect(mockPinFileToIPFS).toHaveBeenCalled();
        });
    });

    describe('GET /files/:hash', () => {
        const hash = 'QmTest123';
        const userAddress = '0xUserAddress';
        const patientAddress = '0xPatientAddress';
        const validSignature = '0xValidSignature';

        it('should require userAddress, patientAddress and signature', async () => {
            const res = await request(app).get(`/files/${hash}`);
            // The code checks for parameters. If missing, it uses strict destructuring or checks checks? 
            // Previous code: const { userAddress, signature, patientAddress } = req.query; if (!userAddress || !signature || !patientAddress) ...
            expect(res.statusCode).toBe(400);
        });

        it('should return 401 if signature verification fails', async () => {
            mockRecover.mockReturnValue('0xDifferentAddress');

            const res = await request(app)
                .get(`/files/${hash}`)
                .query({ userAddress, patientAddress, signature: '0xInvalidSig' });

            expect(res.statusCode).toBe(401);
            // It could be mismatch or failure depending on path
            const errorMsg = res.body.error;
            expect(errorMsg === 'Invalid signature: Address mismatch' || errorMsg === 'Signature verification failed').toBe(true);
            expect(mockRecover).toHaveBeenCalledWith(hash, '0xInvalidSig');
        });

        it('should allow access if userAddress matches patientAddress (Owner)', async () => {
            mockRecover.mockReturnValue(patientAddress.toLowerCase()); 

            mockPinList.mockResolvedValue({ rows: [{ ipfs_pin_hash: hash, metadata: { name: 'file.txt' } }] });

            const res = await request(app)
                .get(`/files/${hash}`)
                .query({ userAddress: patientAddress, patientAddress: patientAddress, signature: validSignature });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.metadata).toHaveProperty('ipfs_pin_hash', hash);
        });

        it('should check contract for access if user is not patient', async () => {
            mockRecover.mockReturnValue(userAddress.toLowerCase());
            mockHasAccess.mockResolvedValue(true); // Contract grants access
            mockPinList.mockResolvedValue({ rows: [{ ipfs_pin_hash: hash }] });

            const res = await request(app)
                .get(`/files/${hash}`)
                .query({ userAddress, patientAddress, signature: validSignature });

            expect(res.statusCode).toBe(200);
            expect(mockHasAccess).toHaveBeenCalled();
        });

        it('should return 403 if contract denies access', async () => {
            mockRecover.mockReturnValue(userAddress.toLowerCase());
            mockHasAccess.mockResolvedValue(false); // Contract denies access

            const res = await request(app)
                .get(`/files/${hash}`)
                .query({ userAddress, patientAddress, signature: validSignature });

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toContain('Access denied');
        });
    });
});
