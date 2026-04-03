defmodule PolarWeb.Router do
  @moduledoc """
  Router for the unified image server.

  Changes from upmaru/polar:
  - Added POST /publish/products/:product_id/versions/:version_id/upload
    for direct multipart artifact upload (from Hye-Ararat/Image-Server).
  - Added GET /storage/*path for serving locally-stored artifacts
    (used when storage_adapter is Polar.Storage.Local).
  """

  use PolarWeb, :router

  import PolarWeb.UserAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {PolarWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :publish do
    plug :accepts, ["json"]
    plug PolarWeb.Plugs.AuthenticateSpace
  end

  pipeline :simplestreams do
    plug :accepts, ["json"]
  end

  # ── Simplestreams (public, unauthenticated) ───────────────────────────────────
  scope "/", PolarWeb do
    pipe_through :simplestreams

    get "/streams/v1/index.json", StreamController, :index
    get "/streams/v1/images.json", StreamController, :images
  end

  # ── Local storage file serving ────────────────────────────────────────────────
  # Only active when storage_adapter is Polar.Storage.Local.
  # S3 adapter serves files directly via pre-signed URLs.
  scope "/storage", PolarWeb do
    pipe_through :api

    get "/*path", StorageController, :show
  end

  # ── Publish API (token-authenticated) ────────────────────────────────────────
  scope "/publish", PolarWeb.Publish do
    pipe_through :publish

    post "/sessions", SessionController, :create

    get  "/storage", StorageController, :show

    get  "/products/:id", ProductController, :show

    get  "/products/:product_id/versions/:id", VersionController, :show
    post "/products/:product_id/versions", VersionController, :create

    resources "/products/:product_id/versions/:version_id/items", ItemController,
      only: [:create, :show]

    # Direct multipart upload — alternative to the icepak CI/CD flow.
    # Accepts rootfs, metadata, and kvmdisk files; hashes and stores them
    # via the configured storage adapter; creates Item records.
    post "/products/:product_id/versions/:version_id/upload", UploadController, :create
  end

  # ── Dashboard (authenticated browser) ────────────────────────────────────────
  scope "/", PolarWeb do
    pipe_through [:browser, :require_authenticated_user]

    live "/spaces", SpaceLive.Index, :index
    live "/spaces/new", SpaceLive.Index, :new
    live "/spaces/:id", SpaceLive.Show, :show
    live "/spaces/:id/credentials/new", SpaceLive.Show, :new_credential
  end

  # ── Auth routes ───────────────────────────────────────────────────────────────
  scope "/", PolarWeb do
    pipe_through :browser

    get "/", PageController, :home

    live "/users/register", UserRegistrationLive, :new
    live "/users/log_in", UserLoginLive, :new
    live "/users/reset_password", UserForgotPasswordLive, :new
    live "/users/reset_password/:token", UserResetPasswordLive, :edit

    post "/users/log_in", UserSessionController, :create
  end

  scope "/", PolarWeb do
    pipe_through [:browser, :require_authenticated_user]

    live "/users/settings", UserSettingsLive, :edit
    live "/users/settings/confirm_email/:token", UserSettingsLive, :confirm_email
  end

  scope "/", PolarWeb do
    pipe_through :browser

    delete "/users/log_out", UserSessionController, :delete
    get "/users/confirm", UserConfirmationController, :new
    post "/users/confirm", UserConfirmationController, :create
    get "/users/confirm/:token", UserConfirmationController, :confirm
  end
end
