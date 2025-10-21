import { Box, Container, Typography } from "@mui/material";
import image from "../assets/group.png";

export default function Home() {
  return (
    <>
      <Box
        sx={{
          width: "100%",
          maxHeight: { xs: "15rem", sm: "20rem", md: "25rem" },
          overflow: "hidden",
          mt: 0.25,
        }}
      >
        <img
          src={image}
          alt="Emdc Homepage"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "grayscale(100%)",
          }}
        />
      </Box>
      <Container maxWidth="lg" sx={{ justifyContent: "center" }}>
        <Box sx={{ mt: { xs: 3, sm: 4, md: 5 } }}>
          <Typography 
            variant="h1"
            sx={{ 
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "1.75rem" },
              lineHeight: 1.3,
              mb: 2
            }}
          >
            Welcome to the Engineering Machine Design Contest (EMDC) Tabulation
            System!
          </Typography>
          <Typography 
            variant="body1"
            sx={{ 
              fontSize: { xs: "0.9rem", sm: "1rem" },
              lineHeight: 1.6,
              mb: 3
            }}
          >
            We're excited to have you on board. Your role is crucial in
            recognizing the creativity, teamwork, and engineering skills
            demonstrated by our student teams.
          </Typography>
        </Box>

        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography 
            variant="h2"
            sx={{ 
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              mb: 2
            }}
          >
            Contest Overview
          </Typography>
          <Typography 
            variant="body1"
            sx={{ 
              fontSize: { xs: "0.9rem", sm: "1rem" },
              lineHeight: 1.6
            }}
          >
            The Engineering Machine Design Contest (EMDC) is an engaging,
            hands-on competition that challenges teams of 5th-12th grade
            students to design and build complex chain-reaction machines. Each
            machine must incorporate a specific contest theme while applying
            principles of science, technology, engineering, and mathematics
            (STEM). Teams work collaboratively to solve engineering challenges
            using recycled materials, innovative ideas, and advanced components
            like mechanical systems, electrical circuits, chemical reactions,
            and more. The competition encourages creativity, resourcefulness,
            and problem-solving while giving students an opportunity to showcase
            their skills in a real-world context.
          </Typography>
        </Box>

        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography 
            variant="h2"
            sx={{ 
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              mb: 2
            }}
          >
            Contest Objectives
          </Typography>
          <Typography 
            variant="body1"
            sx={{ 
              fontSize: { xs: "0.9rem", sm: "1rem" },
              lineHeight: 1.6
            }}
          >
            1. Provide an Accessible Learning Experience: Offer a low-cost,
            affordable opportunity for students from underserved and rural
            communities to engage in hands-on STEM learning.<br/><br/>
            2. Inspire Career Pathways: Spark interest in engineering and
            related career fields by giving students real-world challenges that
            align with their future career aspirations.<br/><br/>
            3. Equip Students with Career-Ready Skills: Develop critical
            thinking, teamwork, and problem-solving skills that will prepare
            students for success in future careers.
          </Typography>
        </Box>
      </Container>
    </>
  );
}
