"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyGatePass = applyGatePass;
exports.getStudentStatus = getStudentStatus;
exports.getAssignedMentor = getAssignedMentor;
const client_1 = require("../prisma/client");
const qrcode_1 = __importDefault(require("qrcode"));
async function applyGatePass(req, res) {
    const user = req.user;
    const { reason } = req.body;
    console.log('reason', reason);
    if (!reason || reason.trim().length < 3) {
        return res.status(400).json({ error: 'Reason must be meaningful.' });
    }
    try {
        const mentorMap = await client_1.prisma.studentMentor.findFirst({
            where: {
                student: {
                    email: user.email.toLowerCase(),
                },
            },
            include: {
                mentor: true,
            },
        });
        if (!mentorMap?.mentor?.email) {
            return res.status(400).json({ error: 'No mentor assigned' });
        }
        const gatePass = await client_1.prisma.gatePass.create({
            data: {
                reason,
                status: 'PENDING',
                student: {
                    connect: {
                        email: user.email.toLowerCase(),
                    },
                },
                mentor: {
                    connect: {
                        email: mentorMap.mentor.email.toLowerCase(),
                    },
                },
            },
        });
        res.status(201).json({ message: 'Submitted', gatePass });
    }
    catch (err) {
        console.error('Apply error:', err);
        res.status(500).json({ error: 'Server error' });
    }
}
async function getStudentStatus(req, res) {
    try {
        const passes = await client_1.prisma.gatePass.findMany({
            where: { student: { email: req.user.email.toLowerCase() } },
            orderBy: { appliedAt: 'desc' },
        });
        const enhanced = await Promise.all(passes.map(async (p) => {
            if (p.status === 'APPROVED' && p.qrToken) {
                const url = `http://localhost:4000/api/security/scan/${p.id}/${p.qrToken}`;
                const qr = await qrcode_1.default.toDataURL(url);
                return { ...p, qr };
            }
            return { ...p, qr: null };
        }));
        res.json({ passes: enhanced });
    }
    catch (err) {
        console.error('Status fetch error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getAssignedMentor(req, res) {
    const user = req.user;
    try {
        const mapping = await client_1.prisma.studentMentor.findFirst({
            where: {
                student: {
                    email: user.email.toLowerCase(),
                },
            },
            include: {
                mentor: true,
            },
        });
        if (!mapping) {
            return res.status(404).json({ error: 'No mentor assigned' });
        }
        const mentor = mapping.mentor;
        res.json({
            mentor: {
                id: mentor.id,
                name: mentor.name,
                email: mentor.email,
                role: mentor.role,
            },
        });
    }
    catch (err) {
        console.error('Mentor fetch error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
