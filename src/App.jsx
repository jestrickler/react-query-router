import axios from 'axios'
import {
  Await,
  createBrowserRouter,
  createRoutesFromElements,
  defer,
  Link,
  Outlet,
  Route,
  RouterProvider,
  useLoaderData,
  useRouteError,
  useSearchParams
} from 'react-router-dom'
import { Suspense } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery
} from '@tanstack/react-query'

const LIMIT = 5

const Layout = () => (
  <>
    <header>
      <nav>
        <Link to='/'>Home</Link>
        <Link to='/albums'>Albums</Link>
      </nav>
    </header>
    <main>
      <Outlet />
    </main>
    <footer>&#169; 2024</footer>
  </>
)
const Home = () => <h1>Home</h1>

const queryClient = new QueryClient()
const api = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  headers: { 'Content-type': 'application/json' }
})

const getAlbumsQuery = (page = 1) => {
  console.log('getAlbumsQuery', page)
  return {
    queryKey: ['albums', page],
    queryFn: ({ queryKey }) => {
      const [_key, page] = queryKey
      console.log('queryFn', page)
      return api
        .get('/albums', {
          params: { _start: (page - 1) * LIMIT, _limit: LIMIT }
        })
        .then((response) => response.data)
    }
  }
}
const albumsLoader = ({ request }) => {
  const page = new URL(request.url).searchParams.get('page') || 1
  console.log('albumsLoader', page)
  return defer({
    response: queryClient.ensureQueryData(getAlbumsQuery(page))
  })
}
const Albums = () => {
  const deferred = useLoaderData()
  return (
    <>
      <h1>Albums</h1>
      {[...Array(5).keys()].map((page) => (
        <Link key={page} to={`?page=${page + 1}`}>
          Page {page + 1}
        </Link>
      ))}
      <button onClick={() => queryClient.clear()}>Clear</button>
      <Suspense fallback={<h2>Loading...</h2>}>
        <Await resolve={deferred.response}>
          <AlbumsList />
        </Await>
      </Suspense>
    </>
  )
}
const AlbumsList = () => {
  const [searchParams] = useSearchParams()
  const page = searchParams.get('page') || 1
  console.log('AlbumsList', page)
  const { data } = useSuspenseQuery(getAlbumsQuery(page))
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}

const ErrorElement = () => {
  const error = useRouteError()
  return (
    <>
      <h1>You caused an error.</h1>
      <p>{error.message}</p>
    </>
  )
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route path='/' errorElement={<ErrorElement />}>
        <Route index element={<Home />} />
        <Route path='albums' element={<Albums />} loader={albumsLoader} />
        <Route path='*' element={<h1>Not Found</h1>} />
      </Route>
    </Route>
  )
)
const App = () => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
)

export { App }
