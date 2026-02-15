import { createBrowserRouter } from 'react-router-dom';

import App from '../app/App';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { CoursesListPage } from '../pages/courses/CoursesListPage';
import { StudentCreatePage } from '../pages/students/StudentCreatePage';
import { StudentDetailsPage } from '../pages/students/StudentDetailsPage';
import { StudentsListPage } from '../pages/students/StudentsListPage';
import { TeachersListPage } from '../pages/teachers/TeachersListPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'students', element: <StudentsListPage /> },
      { path: 'students/create', element: <StudentCreatePage /> },
      { path: 'students/:id', element: <StudentDetailsPage /> },
      { path: 'courses', element: <CoursesListPage /> },
      { path: 'teachers', element: <TeachersListPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
