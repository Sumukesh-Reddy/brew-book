# Brew & Book

This repository contains the full stack code for a Cafe Management System, which consists of a Java Spring Boot backend and a React frontend.

## Project Structure

The repository is organized into two main components:

- `cafe-backend/` - The backend API built with Java, Spring Boot, Spring Security, Hibernate, MySQL, and Razorpay for payments.
- `cafe-frontend/` - The frontend application built with React, React Router, Recharts for data visualization, and QRCode generation capabilities.

## Getting Started

### Prerequisites

To run this application locally, you will need the following installed:
- [Node.js](https://nodejs.org/en) & npm (for the frontend)
- [Java 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
- [Maven](https://maven.apache.org/) (or use the provided `mvnw` wrapper)
- [MySQL Database](https://www.mysql.com/)

### Backend Setup (`cafe-backend`)

The backend is built with Spring Boot. To run the backend standalone:

1. Navigate to the backend directory:
   ```bash
   cd cafe-backend
   ```
2. Configure your MySQL database connection in `application.properties` or `application.yml` (located in `src/main/resources`).
3. Run the application using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   *Note: On Windows, use `mvnw.cmd spring-boot:run`*

The backend will typically start on `http://localhost:8080`.

### Frontend Setup (`cafe-frontend`)

The frontend is a React application created with Create React App.

1. Navigate to the frontend directory:
   ```bash
   cd cafe-frontend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

The frontend will typically be accessible at `http://localhost:3000`.

## Features

- **Backend (Spring Boot):**
  - Secured REST endpoints with Spring Security.
  - Database management utilizing Spring Data JPA and MySQL.
  - Payment gateway integration using Razorpay Java SDK.
  - Email notification support.
  
- **Frontend (React):**
  - Interactive UI with Client-side routing (`react-router-dom`).
  - Analytics and visualization (`recharts`).
  - Printing and QR Code support (`react-to-print`, `qrcode`).

## Technologies Used

| Technology | Purpose |
| ---------- | ------- |
| **Java 17 & Spring Boot** | Backend framework |
| **Spring Security** | Authentication & Authorization |
| **MySQL** | Relational Database |
| **Razorpay** | Server-side Payment processing |
| **React 19** | Frontend view library |
| **React Router** | Client-side routing |
| **Recharts** | Data charting and visualization |
