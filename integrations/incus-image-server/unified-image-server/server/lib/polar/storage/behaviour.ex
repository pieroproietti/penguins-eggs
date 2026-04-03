defmodule Polar.Storage do
  @moduledoc """
  Storage backend abstraction for image artifacts.

  Configure the adapter in config.exs:

      config :polar, :storage_adapter, Polar.Storage.S3
      # or
      config :polar, :storage_adapter, Polar.Storage.Local

  All adapters must implement this behaviour.
  """

  @type path :: String.t()
  @type opts :: keyword()

  @doc """
  Returns a pre-signed URL for reading an object.
  TTL defaults to 3600 seconds.
  """
  @callback get_signed_url(path(), opts()) :: String.t()

  @doc """
  Writes binary data to the given path. Returns :ok or {:error, reason}.
  """
  @callback put_object(path(), binary(), opts()) :: :ok | {:error, term()}

  @doc """
  Deletes the object at the given path.
  """
  @callback delete_object(path()) :: :ok | {:error, term()}

  @doc """
  Returns the public or signed URL for a path, delegating to the configured adapter.
  """
  def get_signed_url(path, opts \\ []) do
    adapter().get_signed_url(path, opts)
  end

  def put_object(path, data, opts \\ []) do
    adapter().put_object(path, data, opts)
  end

  def delete_object(path) do
    adapter().delete_object(path)
  end

  defp adapter do
    Application.get_env(:polar, :storage_adapter, Polar.Storage.S3)
  end
end
