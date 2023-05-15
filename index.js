const express = require('express');
const Sequelize = require('sequelize');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// 데이터베이스 연결
const sequelize = new Sequelize('student', 'root', '1234', {
    dialect: 'mysql',
    host: 'localhost'
});

// 학생 모델 정의
const Student = sequelize.define('student', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    studentNumber: { type: Sequelize.STRING, unique: true },
    name: Sequelize.STRING,
    contact: Sequelize.STRING,
    email: Sequelize.STRING,
    address: Sequelize.STRING,
    registeredDate: Sequelize.DATE
});


// 성적 모델 정의
const Score = sequelize.define('score', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    javaScore: Sequelize.INTEGER,
    pythonScore: Sequelize.INTEGER,
    cScore: Sequelize.INTEGER,
    registeredDate: Sequelize.DATE,
    totalScore: Sequelize.INTEGER,
    averageScore: Sequelize.INTEGER
});

Student.hasMany(Score, { foreignKey: 'studentNumber', sourceKey: 'studentNumber' });
Score.belongsTo(Student, { foreignKey: 'studentNumber', targetKey: 'studentNumber' });


// 학생 등록
app.post('/students', async (req, res) => {
    try {
        const { studentNumber, name, contact, email, address } = req.body;
        const student = await Student.create({
            studentNumber,
            name,
            contact,
            email,
            address,
            registeredDate: new Date()
        });
        return res.json(student);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 학생 성적 출력
app.get("/students/grades", async (req, res) => {
    try {
        const scores = await Student.findAll({
            attributes: [
                ['id', 'studentId'], 'studentNumber', 'name', 'contact', 'email', 'address',
                [sequelize.fn('avg', sequelize.col('scores.averageScore')), 'averageScore'],
                [sequelize.fn('sum', sequelize.col('scores.totalScore')), 'totalScore']
            ],
            include: [
                {
                    model: Score,
                    attributes: [],
                    required: false
                }
            ],
            order: [
                [sequelize.fn('avg', sequelize.col('scores.averageScore')), 'DESC'],
                ['studentNumber', 'ASC']
            ],
            group: ['student.id', 'studentNumber'],
            raw: true
        });

        const scoresWithRank = scores.map((student, index) => ({
            studentNumber: student.studentNumber,
            name: student.name,
            contact: student.contact,
            email: student.email,
            address: student.address,
            totalScore: student.totalScore || 0,
            averageScore: student.averageScore || 0,
            rank: index + 1,
            총인원: scores.length
        }));

        return res.json(scoresWithRank);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});



// 학생 정보 수정
app.put('/students/:id', async (req, res) => {
    try {
        const { name, contact, email, address } = req.body;
        const student = await Student.update(
            {
                name,
                contact,
                email,
                address
            },
            { where: { id: req.params.id } }
        );
        return res.json(student);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


// 학생 정보 삭제
app.delete('/students/:studentNumber', async (req, res) => {
    try {
        await Student.destroy({ where: { id: req.params.studentNumber } });
        await Score.destroy({ where: { id: req.params.studentNumber } });
        return res.json({ message: '삭제되었습니다!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: '삭제중 오류발생!' });
    }
});


// 학번으로 학생 검색
app.get('/students/search/:studentNumber', async (req, res) => {
    try {
        const student = await Student.findOne({
            where: {
                studentNumber: req.params.studentNumber,
            },
            attributes: ['id', 'studentNumber', 'name', 'contact', 'email', 'address'],
            include: [
                {
                    model: Score,
                    attributes: ['id', 'javaScore', 'pythonScore', 'cScore', 'totalScore', 'averageScore']
                }
            ]
        });
        return res.json(student);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: '학번검색중 오류발생!' });
    }
});



// 학생 점수 등록
app.post('/students/:studentNumber/scores', async (req, res) => {
    try {
        const { javaScore, pythonScore, cScore } = req.body;
        const totalScore = parseInt(javaScore) + parseInt(pythonScore) + parseInt(cScore);
        const averageScore = Math.floor(totalScore / 3);
        const score = await Score.create({
            javaScore,
            pythonScore,
            cScore,
            registeredDate: new Date(),
            totalScore,
            averageScore,
            studentNumber: req.params.studentNumber
        });
        return res.json(score);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


// 학생 점수 수정
app.put('/students/scores/:studentNumber', async (req, res) => {
    try {
        const { javaScore, pythonScore, cScore } = req.body;
        const totalScore = parseInt(javaScore) + parseInt(pythonScore) + parseInt(cScore);
        const averageScore = Math.floor(totalScore / 3);
        const score = await Score.update(
            {
                javaScore,
                pythonScore,
                cScore,
                totalScore,
                averageScore
            },
            { where: { studentNumber: req.params.studentNumber } }
        );
        return res.json(score);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


// 학생 점수 삭제
app.delete('/students/scores/:studentNumber', async (req, res) => {
    try {
        await Score.destroy({ where: { studentNumber: req.params.studentNumber } });
        return res.json({ message: 'Delete successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

sequelize.sync().then((client) => {
    console.log(client)
})

// 서버 시작
app.listen(port, () => console.log(`Server is running on port ${port}`));

